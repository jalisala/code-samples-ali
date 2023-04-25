<template>
  <div
    :class="'fill-height ' + (isDesktopView ? '' : 'pa-0')"
  >
    <ObjectPageDesktop v-if="isDesktopView" />
    <ObjectPageMobile v-else />
  </div>
</template>

<script>
import sharedComputed from '../../methods/sharedComputed'
import sharedMethods from '../../methods/sharedMethods'
import ObjectPageDesktop from '@/components/Views/Object/ObjectPageDesktop'
import ObjectPageMobile from '@/components/Views/Object/ObjectPageMobile'
import api from '../../store/api'
import { createHelpers } from 'vuex-map-fields'
import state from '../../store/state.js'

const { mapFields } = createHelpers({
  getterType: 'getField',
  mutationType: 'updateField',
})

export default {
  name: 'ObjectPageContainer',

  metaInfo () {
    return this.getMetaTags()
  },

  props: {
    id: {
      type: String,
      default: null,
    },
  },

  components: {
    ObjectPageMobile,
    ObjectPageDesktop,
  },

  computed: {
    ...mapFields(Object.keys(state)),
    ...sharedComputed,

    datePeriodComputed () {
      return this.searchFilters.dateStart + '_' + this.searchFilters.dateEnd
    },
  },

  watch: {
    datePeriodComputed () {
      if (this.searchFilters.dateStart && this.searchFilters.dateEnd) {
        this.getObjectPrice()
      } else {
        this.resetPrice()
      }
    },

    id (value) {
      if (value) {
        this.selectedObject = {}
        this.getObjectInfo().then(() => {
          this.getObjectPrice()
        })
      }
    },
  },

  created () {
    this.selectedObject = {}
    if (this.id) {
      this.progressOpening = true
      this.getObjectInfo().then(() => {
        this.getObjectPrice()
      })
      window.scrollTo(0, 0)
    }
    this.setContentAreaWidth()
  },

  methods: {
    ...sharedMethods,

    getObjectInfo () {
      return new Promise(resolve => {
        const filters = []
        return api.getOneItemWithQuery('objects', this.id, filters).then(result => {
          // Sort images
          result.objectImages = result.objectImages.sort((a, b) => (
            parseInt(a.sortOrder) > parseInt(b.sortOrder) ? 1 : -1
          ))
          this.selectedObject = result
          this.progressOpening = false
          this.metaTitle = this.selectedObject.objectName + ', ' + this.selectedObject.address
          this.metaUrl = this.objectFullLink(this.selectedObject)
          this.metaDescription = this.getObjectDescription(this.selectedObject)
          this.metaImage = this.getObjectFistImagePreviewFullLink(this.selectedObject)
          resolve(true)
        })
      })
    },
  },
}
</script>
