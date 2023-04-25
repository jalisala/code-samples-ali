<template>
  <div>
    <v-menu
      v-if="field.canRead"
      ref="menu1"
      v-model="menu1"
      :nudge-right="40"
      :close-on-content-click="false"
      transition="scale-transition"
      max-width="290px"
      min-width="290px"
      offset-y
    >
      <template v-slot:activator="{ on }">
        <v-text-field
          v-on="on"
          v-model="dateFormatted"
          :label="labelText"
          :disabled="!field.canEdit"
          :rounded="cs.inputRounded"
          :dense="cs.inputDense"
          :outlined="cs.inputOutlined"
          :filled="cs.inputFilled"
          :background-color="fieldBackgroundColor(dateFormatted, field)"
          hide-details
          hint="MM.DD.YYYY"
          @blur="date = parseDate(dateFormatted)"
        />
      </template>
      <v-date-picker
        v-model="date"
        :locale="$store.state.language"
        first-day-of-week="1"
        no-title
        @input="menu1 = false"
      />
    </v-menu>
  </div>
</template>

<script>
import sharedComputed from './../../computed'
import sharedMethods from './../../methods'
import formElementProps from './formElementProps'

export default {
  name: 'FormDate',

  data () {
    return {
      dateFormatted: null,
      menu1: false
    }
  },

  props: {
    ...formElementProps,
  },

  computed: {
    ...sharedComputed,

    computedDateFormatted () {
      return this.formatDate(this.value[this.field.fieldName])
    },

    date: {
      get: function () {
        return this.value[this.field.fieldName]
      },
      set: function (value) {
        this.value[this.field.fieldName] = value
        this.updateDateFormatted()
      },
    },
  },

  watch: {
    autofillSet (value) {
      if (!value || this.date) { return }
      this.date = value
    },
    date (now, before) {
      if (now && !before) {
        this.$emit('onUserFill')
      }
    },
  },

  methods: {
    ...sharedMethods,

    formatDate (date) {
      if (!date) return null
      const [year, month, day] = date.split('-')
      return `${day}.${month}.${year}`
    },

    parseDate (date) {
      if (!date) return null
      const [day, month, year] = date.split('.')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    },

    updateDateFormatted () {
      if (this.value[this.field.fieldName]) {
        this.dateFormatted = this.formatDate(new Date(this.value[this.field.fieldName]).toISOString().substr(0, 10))
      }
    },
  },

  created () {
    this.updateDateFormatted()
  },
}
</script>
