import axios from 'axios'
import listFilters from './api_list_filters'

const dataUrl = '/data/'
const testSite = false
const localhost = false

const apiUrl = ''

export default {
  getCacheFor (module, sortBy = '') {
    return new Promise(resolve => {
      if ((localhost || testSite) && sortBy) {
        resolve(this.getRequestWithSort(module, sortBy))
        return
      } else if (localhost || testSite) {
        resolve(this.apiRequest('/' + module, [{
          key: 'rowsPerPage',
          value: 1000,
        }]))
        return
      }
      axios.get(dataUrl + module + '.json').then(response => {
        resolve({
          items: response.data
        })
      })
    })
  },

  shareByEmail (data) {
    return this.apiPostRequest('/share', data)
  },

  getRequestWithSort (module, sortBy) {
    return this.apiRequest('/' + module, [{
      key: 'sortBy',
      value: sortBy
    }, {
      key: 'rowsPerPage',
      value: 1000
    }])
  },

  getTemplateVars () {
    return this.getCacheFor('propertyTranslations')
  },

  sendBooking (booking) {
    booking.status = ''
    return this.apiPostRequest('/bookings', booking)
  },

  sendContact (contact) {
    return this.apiPostRequest('/siteContacts', contact)
  },

  findObjects (filters) {
    filters = listFilters(filters)
    let apiFilters = Object.keys(filters)
      .filter(filterName => filters[filterName] !== null && filters[filterName] !== 'null')
      .map(filterName => {
        let value = filters[filterName]
        return {
          key: filterName,
          value: value
        }
      })
    return this.getListItems('objects', apiFilters)
  },

  getSiteMenu () {
    return this.getCacheFor('menu', 'sortOrder')
  },

  getSiteTranslations () {
    return this.getCacheFor('siteTranslations')
  },

  getBookingExtras () {
    return this.getCacheFor('bookingExtras')
  },

  getSiteBanners () {
    return this.getCacheFor('banners')
  },

  getWeather () {
    return this.getCacheFor('weatherRecordings')
  },

  getObjectRegions () {
    return this.getCacheFor('objectRegions', 'sortOrder')
  },

  getGalleries () {
    return this.getCacheFor('galleries')
  },

  saveItem (moduleName, data) {
    return new Promise((resolve) => {
      if (data._id) {
        this.apiPutRequest('/' + moduleName + '/' + data._id, data).then((response) => {
          resolve(response)
        })
      } else {
        this.apiPostRequest('/' + moduleName, data).then((response) => {
          resolve(response)
        })
      }
    })
  },

  login (username, password) {
    return new Promise((resolve) => {
      axios.post(apiUrl + '/login', {
        username: username,
        password: password
      }, this.sendHeaders()).then((response) => {
        if (response.data) {
          resolve(response.data)
        }
        resolve({})
      }).catch((error) => {
        resolve(error.response.data)
      })
    })
  },

  logout () {
    return new Promise((resolve) => {
      axios.get(apiUrl + '/logout', this.sendHeaders()).then((response) => {
        if (response.data) {
          resolve(response.data)
        }
        resolve({})
      }).catch((error) => {
        resolve(error.response.data)
      })
    })
  },

  getOneItem (moduleName, itemId) {
    if (itemId === '0') {
      return new Promise((resolve) => {
        resolve({})
      })
    }
    return this.apiRequest('/' + moduleName + '/' + itemId, [])
  },

  getOneItemWithQuery (moduleName, itemId, queries) {
    if (itemId === '0') {
      return new Promise((resolve) => {
        resolve({})
      })
    }
    return this.apiRequest('/' + moduleName + '/' + itemId, queries)
  },

  getListItems (moduleName, filters) {
    return this.apiRequest('/' + moduleName, filters)
  },

  apiRequest (url, filters) {
    return new Promise((resolve) => {
      axios.get(apiUrl + url + '?' +
        filters.map(
          filter => filter.key + '=' + filter.value
        ).join('&'), this.sendHeaders()).then((response) => {
        if (response.data) {
          resolve(response.data)
        }
        resolve({})
      }).catch((error) => {
        resolve(error.response.data)
      })
    })
  },

  apiPostRequest (url, postData) {
    return new Promise((resolve) => {
      axios.post(apiUrl + url, postData, this.sendHeaders()).then((response) => {
        if (response.data) {
          resolve(response.data)
        }
        resolve({})
      }).catch((error) => {
        resolve(error.response.data)
      })
    })
  },

  apiPutRequest (url, postData) {
    return new Promise((resolve) => {
      axios.put(apiUrl + url, postData, this.sendHeaders()).then((response) => {
        if (response.data) {
          resolve(response.data)
        }
        resolve({})
      }).catch((error) => {
        resolve(error.response.data)
      })
    })
  },

  sendHeaders () {
    return {
      headers: {
        // Project specific
      }
    }
  }
}
