<template>
  <v-col
    :cols="!showListObjectInfoVertically || isMobileView ? 12 : 4"
  >
    <v-container class="shadow list-object pa-0 white">
      <v-row no-gutters>
        <v-col
          :cols="showListObjectInfoVertically ? 12 : null"
          :class="!showListObjectInfoVertically ? 'shrink' : ''"
        >
          <ListObjectImages :object="object" />
        </v-col>
        <v-col
          :class="'pa-0 ' + !showListObjectInfoVertically ? ' grow' : ''"
        >
          <div>
            <v-row>
              <v-col>
                <v-container
                  :class="showListObjectInfoVertically ? 'pa-2' : 'pt-1-5 pb-0'"
                >
                  <ListObjectTitle :object="object" />
                  <v-row no-gutters>
                    <ListObjectFeatures :object="object" />
                    <ListObjectBottomInfoBar
                      v-if="!emailing"
                      :object="object"
                      :hide-price="hidePrice"
                      :booking-now="bookingNow"
                    />
                  </v-row>
                </v-container>
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-col>
</template>

<script>
import sharedMethods from '../../../methods/sharedMethods'
import ListObjectImages from '@/components/List/ListObject/ListObjectImages'
import ListObjectBottomInfoBar from '@/components/List/ListObject/ListObjectBottomInfoBar'
import ListObjectTitle from '@/components/List/ListObject/ListObjectTitle'
import ListObjectFeatures from '@/components/List/ListObject/ListObjectFeatures'
import sharedComputed from '@/methods/sharedComputed'
import { createHelpers } from 'vuex-map-fields'
import state from '../../../store/state.js'

const { mapFields } = createHelpers({
  getterType: 'getField',
  mutationType: 'updateField'
})

export default {
  name: 'ListObject',

  props: {
    object: {
      type: Object,
      default: () => {
        return {}
      },
    },
    bookingNow: {
      type: Boolean,
      default: false,
    },
    emailing: {
      type: Boolean,
      default: false
    },
    hidePrice: {
      type: Boolean,
      default: false,
    },
  },

  components: {
    ListObjectFeatures,
    ListObjectTitle,
    ListObjectBottomInfoBar,
    ListObjectImages,
  },

  computed: {
    ...sharedComputed,
    ...mapFields(Object.keys(state)),
  },

  methods: {
    ...sharedMethods,
  },
}
</script>
