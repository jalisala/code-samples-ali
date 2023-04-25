/*
* Define a module that exports a method for retrieving access control grants
* from a MongoDB database and caching them in Redis.
* The access control grants are composed based on user group and field access rules,
* and are returned in JSON format.
* The grants are cached in Redis with a 5-minute expiration time to reduce database load.
* */

const Memcached = require('memcached');
const mongoose = require('mongoose');

// Set default values for Memcached
let memcachedString = 'localhost:11211';
let memcachedOptions = {}

// Check if Memcachier is available, if so use its settings
if (process.env && process.env['MEMCACHIER_SERVERS']) {
  memcachedOptions = {
    username: process.env['MEMCACHIER_USERNAME'],
    password: process.env['MEMCACHIER_PASSWORD']
  }
  memcachedString = process.env['MEMCACHIER_SERVERS']
}
const redisKey = 'acGrants___2'
const redis = require('redis');

// Check if Redis URL is set, if so use it, otherwise use default Redis connection
let redisClient;
if (process.env && process.env.REDIS_URL) {
  redisClient = redis.createClient(process.env.REDIS_URL);
} else {
  redisClient = redis.createClient();
}

// Create Memcached and set default expiration time
const memcached = new Memcached(memcachedString, memcachedOptions);
const expiresIn = 60*5;

// Function to compose grants object from user groups
const composeGrants = (data) => {
  let grantsObject0 = {}
  let grantsObject = {}

  data.forEach(userGroup => {
    grantsObject0[userGroup.identifier] = {}

    // If user group extends other user groups, add those to grants object
    if (userGroup.extendsOnUsergroups && userGroup.extendsOnUsergroups.split(',').length > 0) {
      grantsObject0[userGroup.identifier]['$extend'] = userGroup.extendsOnUsergroups.split(',')
        .map(userGroup => userGroup.trim())
    }

    // If user group has full access to certain modules, add that to grants object
    if (userGroup.fullAccessModuleNames) {
      userGroup.fullAccessModuleNames.split(',').forEach(moduleName => {
        moduleName = moduleName.trim()
        grantsObject0[userGroup.identifier][moduleName] = {
          'create:any': ['*'],
          'read:any': ['*'],
          'update:any': ['*'],
          'delete:any': ['*']
        }
      })
    }

    // Add module access rules to grants object for each access type (create, read, update, delete)
    const accessTypes = {
      createModuleNames: 'create:any',
      readAllModuleNames: 'read:any',
      readOwnModuleNames: 'read:own',
      updateAllModuleNames: 'update:any',
      updateOwnModuleNames: 'update:own',
      deleteAllModuleNames: 'delete:any',
      deleteOwnModuleNames: 'delete:own'
    }
    Object.keys(accessTypes).forEach(accessType => {
      if (userGroup[accessType]) {
        userGroup[accessType].split(',').forEach(moduleName => {
          moduleName = moduleName.trim()
          if (!grantsObject0[userGroup.identifier][moduleName]) {
            grantsObject0[userGroup.identifier][moduleName] = {}
          }
          grantsObject0[userGroup.identifier][moduleName][accessTypes[accessType]] = ['*']
        })
      }
    })
  })
  return grantsObject0
}

// Export module with a function to get access control grants for modules in a database
module.exports = {
  get: (modules, db) => {
    return new Promise(resolve => {
      if (!db || db === 'null') {
        resolve({});
        return;
      }
      redisClient.get(redisKey + db, function(err, acGrants) {
        if (acGrants) {
          // Return from Redis cache
          resolve(JSON.parse(acGrants));
        } else {
          try {
            const query = global.dbConnections[db].model('userGroups').find();
            query.exec((err, data) => {
              const grants = composeGrants(data.slice())
              const fieldsQuery = global.dbConnections[db].model('fieldAccessRules').find();
              fieldsQuery.populate('userGroup');
              fieldsQuery.exec((err2, fieldsData) => {
                fieldsData.forEach(fieldData => {
                  const userGroup = fieldData.userGroup && fieldData.userGroup.identifier
                  const moduleName = fieldData.moduleName
                  const onReadAny = fieldData.onReadAny
                  const onUpdateAny = fieldData.onUpdateAny
                  const fields = fieldData.fields

                  if (moduleName && userGroup && fields) {
                    if (onReadAny && grants[userGroup]) {
                      if (!grants[userGroup][moduleName]) {
                        grants[userGroup][moduleName] = {}
                      }
                      grants[userGroup][moduleName]['read:any'] = fields.split(',')
                    }
                    if (onUpdateAny && grants[userGroup]) {
                      if (!grants[userGroup][moduleName]) {
                        grants[userGroup][moduleName] = {}
                      }
                      grants[userGroup][moduleName]['update:any'] = fields.split(',')
                    }
                  }
                })
                redisClient.set(redisKey + db, JSON.stringify(grants), 'EX', expiresIn)
                resolve(grants);
              })
            })
          } catch (e) {
            resolve([]);
          }
        }
      });
    })
  }
}
