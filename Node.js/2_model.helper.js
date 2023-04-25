const mongoose = require('mongoose');
const getSchemaForModule = require('./general.model3.js');
const helper = require('./../helpers/helper.js');

const schemasRefreshTimerDelay = 1000*60*5
const refreshTimers = {}

// Managing database connections, schemas and models using the Mongoose library

const self = module.exports = {
  /*
  * If the modules have not been registered yet,
  * the method calls self.registerDbModules(db) to register them and returns the result.
  * Returns a Promise that resolves to an object of registered database modules
  * for the given db connection.
  * */
  getDbModules: (db) => {
    return new Promise(resolve => {
      if (self.areDbModelsRegistered(db)) {
        resolve(self.getRegisteredModules(db))
      } else {
        self.registerDbModules(db).then(modules => {
          resolve(modules)
        })
      }
    })
  },

  /*
  * The method also sets a timer to call itself again after the specified delay and
  * store the timer in refreshTimers to prevent multiple timers from being set for
  * the same db connection.
  * Returns a Promise that resolves to the registered modules for the given db connection.
  * */
  refreshDbModels: (db) => {
    return new Promise(resolve => {
      self.registerDbModules(db).then(modules => {
        resolve(modules)
        if (!refreshTimers[db]) {
          refreshTimers[db] = setTimeout(() => {
            self.refreshDbModels(db)
          }, schemasRefreshTimerDelay)
        }
      })
    })
  },

  /*
  * The method calls self.createDbModelsAndGetModules(db) to create the database models for each module
  * and self.initModuleSchemas(db, modules) to initialize the schema for each module.
  * It then stores the registered modules in global.registeredModulesByDb[db]
  * and sets a timer to call self.refreshDbModels(db) after the specified delay if schemasRefreshTimerDelay is set.
  * Returns a Promise that resolves to an object of registered modules for the given db connection.
  * */
  registerDbModules: (db) => {
    return new Promise(resolve => {
      self.createDbModelsAndGetModules(db).then(modules => {
        self.initModuleSchemas(db, modules).then(result => {
          global.registeredModulesByDb[db] = modules;
          if (schemasRefreshTimerDelay) {
            setTimeout(() => {
                self.refreshDbModels(db)
              }, schemasRefreshTimerDelay
            )
          }
          resolve(modules)
        })
      }).catch(e => {
        resolve({})
      })
    })
  },

  /*
  * Initializes the schema for each module by calling getSchemaForModule(modules, moduleName)
  * to get the schema for each module and registering the schema with Mongoose using global.dbConnections[db].model(moduleName, schema).
  * If the model has already been registered, the method first deletes it from global.dbConnections[db].models
  * before registering the new schema.
  * */
  initModuleSchemas: (db, modules) => {
    return new Promise(resolve => {
      Object.keys(modules).map(moduleName => {
        try {
          let schema = getSchemaForModule(modules, moduleName)
          if (global.dbConnections[db].model) {
            delete global.dbConnections[db].models[moduleName]
          }
          global.dbConnections[db].model(moduleName, schema)
        } catch (error) {
          console.log('ERROR with schema', moduleName, error)
        }
      })
      resolve(true)
    })
  },

  /*
  * Returns an object of registered modules for the given db connection from global.registeredModulesByDb.
  * */
  getRegisteredModules: (db) => {
    return global.registeredModulesByDb && global.registeredModulesByDb[db] || {}
  },

  /*
  * Returns true if the models for the db connection have already been registered and false otherwise.
  * */
  areDbModelsRegistered: (db) => {
    return !!(global.registeredModulesByDb && global.registeredModulesByDb[db] && global.registeredModulesByDb[db].users)
  },

  dbPrefix: (db) => {
    return db.replace('-', '_')
  },

  /*
  * Creates and returns a new Mongoose schema
  * using the given schemaFields and options to enable timestamps and virtual getters/setters.
  *  */
  getSchema: (dbConnection, schemaFields) => {
    return mongoose.Schema(schemaFields, {
        timestamps: true,
        toObject: {
          virtuals: true,
          getters: true
        },
        toJSON: {
          virtuals: true,
          getters: true
        }
    });
  },

  /*
  * Method that registers a limited system schema with Mongoose using the given fileName to import the schema fields,
  * modelName to name the model and collectionName to name the MongoDB collection.
  * */
  registerSystemLimitedSchema: (dbConnection, fileName, modelName, collectionName) => {
    const fields = require('./system.models.' + fileName);
    const schema = self.getSchema(dbConnection, fields);
    dbConnection.model(modelName, schema, collectionName);
  },

  /*
  * The method loads the package modules for the controller module
  * and extracts the relevant modules for the given tenantDb from the package modules.
  * Returns a Promise that resolves to an object of modules to be registered for the given tenantDb connection.
  * */
  loadPackageModules: (tenantDb) => {
    return new Promise(resolve => {
      let packageModules = {}

      if (global.registeredModulesByDb?.controller) {
        Object.keys(global.registeredModulesByDb.controller).forEach(moduleName => {
          let module = global.registeredModulesByDb.controller[moduleName]
          if (module.modulePackage) {
            if (!packageModules[module.modulePackage]) {
              packageModules[module.modulePackage] = []
            }
            packageModules[module.modulePackage].push(module)
          }
        })
      }

      let packagesToApply = global?.[tenantDb]?.packages?.split(',') || ['system']
      let modules = {}
      if (tenantDb === 'controller') {
        resolve(modules)
        return
      }

      packagesToApply.forEach(onePackage => {
        onePackage = onePackage.trim()
        if (packageModules?.[onePackage]) {
          packageModules[onePackage].forEach(module => {
            modules[module.moduleName] = module
          })
        }
      })
      resolve(modules)
    })
  },

  /*
  * Create database models for all modules in the project and return a list of
  * Module objects representing the modules with their fields and relations applied.
  * */
  createDbModelsAndGetModules: (db) => {
    const dbInit = global.clientConnection;
    global.dbConnections[db] = dbInit.useDb(db);
    const tenantDb = global.dbConnections[db]
    return new Promise(resolve => {

      self.loadPackageModules(db).then(packageModules => {
        let modules = packageModules
        self.registerSystemLimitedSchema(tenantDb, 'menuGroups', 'system_menu_groups', 'menugroups');
        self.registerSystemLimitedSchema(tenantDb, 'moduleViews', 'system_module_views', 'moduleviews');
        self.registerSystemLimitedSchema(tenantDb, 'moduleFields', 'system_module_fields', 'modulefields');
        self.registerSystemLimitedSchema(tenantDb, 'moduleTabs', 'system_module_tabs', 'moduletabs');
        self.registerSystemLimitedSchema(tenantDb, 'moduleFieldTypes', 'system_module_field_types', 'modulefieldtypes');
        self.registerSystemLimitedSchema(tenantDb, 'modules', 'system_modules', 'modules');
        self.registerSystemLimitedSchema(tenantDb, 'moduleFieldDisplayRules', 'system_module_field_display_rules', 'modulefielddisplayrules');

        const modulesQuery = tenantDb.models.system_modules.find();
        modulesQuery.populate({ path: 'menuGroup' });

        modulesQuery.exec((err3, modulesData) => {
          if (!modulesData) {
            resolve([])
            return
          }

          modulesData.forEach(moduleData => {
            if (!(moduleData.moduleName in modules)) {
              modules[moduleData.moduleName] = JSON.parse(JSON.stringify(moduleData))
              modules[moduleData.moduleName].fields = {}
            }
          })

          const fieldsQuery = tenantDb.models.system_module_fields.find();
          fieldsQuery.populate({ path: 'moduleFieldType' });
          fieldsQuery.populate({ path: 'linkModule' });
          fieldsQuery.populate({ path: 'module' });
          fieldsQuery.exec((err2, moduleFields) => {
            const fieldRulesQuery = tenantDb.models.system_module_field_display_rules.find();
            fieldRulesQuery.exec((err4, moduleFieldRules) => {
              const moduleViewsQuery = tenantDb.models.system_module_views.find();
              moduleViewsQuery.populate({ path: 'module' });
              moduleViewsQuery.exec((err5, moduleViews) => {
                const moduleGroupsQuery = tenantDb.models.system_module_tabs.find();
                moduleGroupsQuery.populate({ path: 'module' });
                moduleGroupsQuery.exec((err3, moduleTabs) => {
                  self.applyFieldsToModule(modules, moduleFields, moduleFieldRules, moduleTabs, moduleViews)
                  resolve(JSON.parse(JSON.stringify(modules)))
                })
              })
            })
          })
        })
      }).catch(e => {
        resolve({})
      })
    })
  },

  /*
  * Apply the given fields to the given module and return a Module object representing
  * the module with the fields applied.
  * */
  applyFieldsToModule: (modules, moduleFields, moduleFieldRules, moduleTabs, moduleViews) => {
    if (!moduleFields) { return }
    let moduleFieldRulesByFieldId = {}
    moduleFieldRules.forEach(rule => {
      if (!moduleFieldRulesByFieldId[rule.moduleField]) {
        moduleFieldRulesByFieldId[rule.moduleField] = {}
      }
      if (!moduleFieldRulesByFieldId[rule.moduleField][rule.conditionField]) {
        moduleFieldRulesByFieldId[rule.moduleField][rule.conditionField] = []
      }
      moduleFieldRulesByFieldId[rule.moduleField][rule.conditionField].push(rule)
    })

    // Apply moduleViews
    moduleViews.forEach(view => {
      if (!modules[view.module.moduleName].moduleViews) {
        modules[view.module.moduleName].moduleViews = []
      }
      modules[view.module.moduleName].moduleViews.push(view)
    })


    // Apply fields
    moduleFields.forEach(moduleField => {
      let newFields = JSON.parse(JSON.stringify(moduleField))
      newFields.type = moduleField.moduleFieldType && moduleField.moduleFieldType.typeName || null
      newFields.listHide = newFields.listShow !== true
      if (moduleField.listFilter && !moduleField.filterType) {
        moduleField.filterType = "Text"
      }

      if (typeof newFields.linkModule === 'object' && newFields.linkModule) {
        newFields.linkModule = newFields.linkModule.moduleName
      }
      if (moduleField.config && helper.isValidJson(moduleField.config, moduleField)) {
        let configProps = JSON.parse(moduleField.config)
        Object.keys(configProps).forEach(key => {
          newFields[key] = configProps[key]
        })
      }

      // Set field display rules
      newFields.displayRules = moduleFieldRulesByFieldId[newFields.id] || {}
      if (moduleField && moduleField.module && moduleField.module.moduleName) {
        const fieldAlreadyRegistered = moduleField.fieldName in modules[moduleField.module.moduleName].fields  // by packages module
        if (!fieldAlreadyRegistered) {
          modules[moduleField.module.moduleName].fields[moduleField.fieldName] = newFields
        }
      }
    })

    // Apply form tabs
    moduleTabs.forEach(moduleTab => {
      let newTab = JSON.parse(JSON.stringify(moduleTab))
      const moduleName = newTab.module && newTab.module.moduleName
      if (moduleName && modules[moduleName]) {
        if (!modules[moduleName].tabs) { modules[moduleName].tabs = {} }
        if (!modules[moduleName].tabs[newTab.tabName]) {
          modules[moduleName].tabs[newTab.tabName] = newTab
        }
      }
    })
  }
}
