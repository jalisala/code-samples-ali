<template>
  <v-col
    v-if="showInTab(field)"
    :cols="gridColumns(field)"
    :class="classes"
  >
    <template
      v-if="(field.info.readOnlyWhenCreated && !value._id) ||
        field.info.readOnly ||
        field.info.type === 'Virtual' ||
        field.info.type === 'SavedVirtual'"
    >
      <template v-if="field.info.type === 'Date'">
        <v-text-field
          :value="showDate(value[field.fieldName])"
          :label="labelText"
          :outlined="cs.inputOutlined"
          :filled="cs.inputFilled"
          :rounded="cs.inputRounded"
          :dense="cs.inputDense"
          hide-details
          disabled
          readonly
        />
      </template>
      <template v-else-if="field.info.type === 'Datetime'">
        <v-text-field
          :value="showDatetime(value[field.fieldName])"
          :label="labelText"
          :outlined="cs.inputOutlined"
          :filled="cs.inputFilled"
          :rounded="cs.inputRounded"
          :dense="cs.inputDense"
          hide-details
          disabled
          readonly
        />
      </template>
      <div v-else class="cut-long-text_SKIP">
        <v-text-field
          :value="value[field.fieldName]"
          :label="labelText"
          :outlined="cs.inputOutlined"
          :filled="cs.inputFilled"
          :rounded="cs.inputRounded"
          :dense="cs.inputDense"
          color="orange"
          hide-details
          disabled
          readonly
        />
      </div>
    </template>

    <!-- STRING -->

    <FormInput
      v-else-if="field.info.type === 'String'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :save-callback="saveFormData"
      :module-name="moduleName"
    />

    <!-- IMAGE -->

    <FormImage
      v-else-if="field.info.type === 'Image'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :module-name="moduleName"
    />

    <!-- PRIVATE FILE -->

    <FormPrivateFile
      v-else-if="field.info.type === 'PrivateFile'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :module-name="moduleName"
    />

    <!-- FILE -->

    <FormFile
      v-else-if="field.info.type === 'File'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :module-name="moduleName"
    />

    <!-- RICHTEXT -->

    <FormRichtext
      v-else-if="field.info.type === 'Richtext'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :module-name="moduleName"
    />

    <!-- RICHTEXT -->

    <HTMLEditor
      v-else-if="field.info.type === 'HtmlCode'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :module-name="moduleName"
    />

    <!-- DATE -->

    <FormDate
      v-else-if="field.info.type === 'Date'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :autofillSet="autofillSet"
      :module-name="moduleName"
      @onUserFill="$emit('onUserFill', field.fieldName)"
    />

    <!-- DATETIME -->

    <FormDateTime
      v-else-if="field.info.type === 'Datetime'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :module-name="moduleName"
    />

    <!-- NUMBER -->

    <FormNumber
      v-else-if="field.info.type === 'Number'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :module-name="moduleName"
    />

    <!-- BOOLEAN -->
    <FormBoolean
      v-else-if="field.info.type === 'Boolean'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :module-name="moduleName"
      @onUserFill="$emit('onUserFill', field.fieldName)"
    />


    <!-- OBJECT STATE -->

    <FormObjectState
      v-else-if="field.fieldName === 'state' && field.info.type === 'Link' &&
      field.canRead &&
      showInForm(field, field.fieldName)"
      v-model="value[field.fieldName]"
      :field="field"
      :label-text="labelText"
      :id="id"
      :module-name="moduleName"
      :change-state-for-field="changeStateForField"
    />



    <!-- LINK -->

    <v-autocomplete
      v-else-if="field.info.type === 'Link' &&
        field.canRead &&
        showInForm(field, field.fieldName)"
      v-model="value[field.fieldName]"
      :items="linkOptionsComputed"
      :label_x="field.info.linkOptionsFilterField"
      :label="labelText"
      :disabled="!field.canEdit || isParentReferenceField(field.fieldName)"
      item-text="text"
      item-value="value"
      :rounded="cs.inputRounded"
      :dense="cs.inputDense"
      :outlined="cs.inputOutlined"
      :filled="cs.inputFilled"
      :background-color="fieldBackgroundColor(value[field.fieldName], field)"
      :append-outer-icon="value[field.fieldName] ? 'fa-external-link-alt' : null"
      :search-input.sync="searchInput"
      @click:append-outer="openReferenceLink(field, value[field.fieldName])"

      clearable
      hide-details
    />

    <!-- MULTILINK -->

    <FormMultiLink
      v-else-if="field.info.type === 'MultiLink'"
      v-model="value"
      :field="field"
      :label-text="labelText"
      :link-options="linkOptions"
      :module-name="moduleName"
    />

    <!-- TITLE -->

    <h2 v-else-if="field.info.type === 'Title' && field.canRead">
      {{ labelText }}
    </h2>

    <!-- DENORMALIZED CHILD -->

    <DenormalizedChildren
      v-else-if="field.info.type === 'Denormalized'"
      v-model="value[field.fieldName]"
      :label-text="labelText"
      :field="field"
    />

    <!-- FEATURES BY GROUP -->

    <FeaturesByGroup
      v-else-if="field.info.type === 'FeaturesByGroup'"
      v-model="value[field.fieldName]"
      :label="labelText"
      :parent-module-name="moduleName"
      :parent-id="id"
      :feature-group-ids="field.info.featureGroupIds"
    />

    <!-- FEATURES FROM GROUP -->

    <template v-else-if="field.info.type === 'Features'">
      <h3>{{ labelText }}</h3>
      <v-divider />
      <features-from-group
        v-model="value[field.fieldName]"
        :parent-module-name="moduleName"
        :feature-group-ids="[fieldConfig.featureGroupId]"
      />
    </template>

    <!-- SUBTABLE -->

    <FormSubtable
      v-else-if="field.info.type === 'Subtable'"
      v-model="value"
      :field="field"
      :parent-id="id"
      :label-text="labelText"
      :module-name="moduleName"
      :level="level"
      :set-subtable-form-open-module="setSubtableFormOpenModule"
    />

  </v-col>
</template>

<script>
import FormObjectState from './FormElements/FormObjectState'
import FormMultiLink from './FormElements/FormMultiLink'
import FormBoolean from './FormElements/FormBoolean'
import FormInput from './FormElements/FormInput'
import FormImage from './FormElements/FormImage'
import FormPrivateFile from './FormElements/FormPrivateFile'
import FormFile from './FormElements/FormFile'
import FormRichtext from './FormElements/FormRichtext'
import FormNumber from './FormElements/FormNumber'
import FormDate from './FormElements/FormDate'
import FormDateTime from './FormElements/FormDateTime'
import FormSubtable from './FormElements/FormSubtable'
import sharedComputed from './../computed'
import sharedMethods from './../methods'
import FeaturesByGroup from './FeaturesByGroup'
import FeaturesFromGroup from './FeaturesFromGroup'
import DenormalizedChildren from './DenormalizedChildren'
import HTMLEditor from './FormElements/HTMLEditor'

export default {
  name: 'ModuleFormField',

  components: {
    HTMLEditor,
    FormObjectState,
    DenormalizedChildren,
    FeaturesByGroup,
    FeaturesFromGroup,
    FormInput,
    FormNumber,
    FormRichtext,
    FormSubtable,
    FormPrivateFile,
    FormImage,
    FormFile,
    FormDate,
    FormBoolean,
    FormDateTime,
    FormMultiLink
  },

  data () {
    return {
      searchInput: null,
      linkOptionsBySearch: [],
      searchTimer: null,
    }
  },

  props: {
    value: {
      type: Object,
      default: () => {
        return {}
      }
    },
    autofillSet: {
      type: [String, Number, Boolean, Object],
      default: null
    },
    field: {
      type: Object,
      default: () => {
        return {}
      }
    },
    linkOptions: {
      type: Object,
      default: () => {
        return {}
      }
    },
    moduleName: {
      type: String,
      default: null
    },

    parentModule: {
      type: String,
      default: null
    },

    parentId: {
      type: String,
      default: null
    },

    id: {
      type: String,
      default: null
    },

    tab: {
      type: String,
      default: null
    },

    subtableFormOpenForModule: {
      type: String,
      default: null
    },

    setSubtableFormOpenModule: {
      type: Function,
      default: () => {}
    },

    level: {
      type: Number,
      default: 0
    },

    saveFormData: {
      type: Function,
      default: () => {}
    },

    displayNone: {
      type: Boolean,
      default: false
    }
  },

  created () {
    // Get link options filtered by another field
    if (this.linkOptionsFilterField) {
      this.searchLinkOptionsBySearchInput()
    }
  },

  computed: {
    ...sharedComputed,

    linkOptionsFilterField () {
      return this.modules[this.moduleName].fields[this.field.fieldName].linkOptionsFilterField
    },

    // Generate an array of options for a select dropdown field based on certain conditions.
    linkOptionsComputed () {
      const linkModuleDisplayField = this.modules[this.moduleName].fields[this.field.fieldName].linkModuleDisplayField
      if ((this.searchInput && this.linkOptionsBySearch.length > 0) || this.linkOptionsFilterField) {
        return this.linkOptionsBySearch.map((option) => {
          return {
            text: option[linkModuleDisplayField + '_' + this.language] ||
              option[linkModuleDisplayField + '_en'] ||
              option[linkModuleDisplayField],
            value: option._id,
            info: option
          }
        })
      }
      // If current value is not in select options, add it
      const selectedPopulatedValue = this.value[this.field.fieldName + 'Populated']
      const optionsIncludesSelectedValue = selectedPopulatedValue &&
        this.linkOptions[this.field.fieldName].map(option => option.value).includes(selectedPopulatedValue.id)
      if (!optionsIncludesSelectedValue && selectedPopulatedValue) {
        const selectedValueForDropdown = {
          text: selectedPopulatedValue[linkModuleDisplayField + '_' + this.language] ||
              selectedPopulatedValue[linkModuleDisplayField + '_en'] ||
              selectedPopulatedValue[linkModuleDisplayField],
          value: selectedPopulatedValue.id,
          info: selectedPopulatedValue
        }
        return [selectedValueForDropdown]
      }
      return this.linkOptions[this.field.fieldName]
    },

    // Build classes
    classes () {
      let classes = [
        'elevation-0',
        'text-left'
      ]
      if (this.displayNone) {
        classes.push('d-none')
      }
      if (this.field.info.type === 'Subtable') {
        classes.push('pa-0')
      }
      if (this.subtableFormOpenForModule === this.field.fieldName) {
        classes.push('pa-0')
      }
      return classes
    },

    // Build config
    fieldConfig () {
      let config = {}
      if (!this.field || !this.field.info || !this.field.info.config) {
        return config
      }
      try {
        config = JSON.parse(this.field.info.config)
      } catch (e) {
        console.log('broken config for ', this.field, e)
      }
      return config
    },

    // Generate label text
    labelText () {
      return this.field.info['fieldNameText_' + this.language] || this.field.info.fieldNameText_en || this.field.info.fieldName
    },

    // Return if all options are ready
    allLinkOptionsDownloaded () {
      let options = this.linkItems && this.linkItems[this.field.info.linkModule]
      let optionsCount = this.linkItemsCount && this.linkItemsCount[this.field.info.linkModule]
      const allOptionsDownloaded = options && options.length === optionsCount
      return allOptionsDownloaded
    }
  },

  watch: {
    searchInput (searchInput) {
      if (!searchInput && this.linkModuleDisplayField) {
        this.linkOptionsBySearch = []
        return false
      }
      if (!this.allLinkOptionsDownloaded) {
        clearTimeout(this.searchTimer)
        this.searchTimer = setTimeout(() => {
          this.searchLinkOptionsBySearchInput(searchInput)
        }, 300)
      }
    }
  },

  methods: {
    ...sharedMethods,

    // Perform serach
    searchLinkOptionsBySearchInput (searchInput) {
      this.$store.dispatch('getLinkFieldListItems', {
        moduleName: this.field.info.linkModule,
        linkModuleDisplayField: this.field.info.linkModuleDisplayField,
        searchInput: searchInput,
        linkOptionsFilterField: this.linkOptionsFilterField,
        linkOptionsFilterFieldValue: this.value[this.linkOptionsFilterField]

      }).then(result => {
        this.linkOptionsBySearch = result.items
      })
    },

    // Open linked item
    openReferenceLink (field, value) {
      if (value && field && field.info && field.info.linkModule) {
        window.open('/#/' + field.info.linkModule + '/form/' + value, '_blank')
      }
    },

    changeStateForField (field, objectState) {
      this.value[field.fieldName] = objectState.id
    },

    // Show in tab
    showInTab (field) {
      let tabValid = false
      // For 'info' tab show when field has no tab set
      if (this.tab === 'info' && !field.info.tab) {
        tabValid = true
      }
      if (!this.tab && !field.info.tab) {
        tabValid = true
      } else if (this.tab === field.info.tab) {
        tabValid = true
      }
      return tabValid && this.passesFieldDisplayRules(field)
    },

    // Determine whether a given field should be displayed or not,
    // based on the display rules defined for the field in the component's modules property
    passesFieldDisplayRules (field) {
      if (field.fieldName === 'createdAt' && this.id === '0') { return false }
      let displayRules = this.modules[this.moduleName].fields[field.fieldName].displayRules
      if (!displayRules || Object.keys(displayRules).length === 0) { return true }
      // Currently only supporting AND conditions
      let conditionsPassed = true
      Object.keys(displayRules).forEach(conditionField => {
        displayRules[conditionField].forEach(displayRule => {
          if (displayRule.mustHave) {
            if (!displayRule.mustHaveValue) { displayRule.mustHaveValue = null }
            if (this.value[conditionField] !== displayRule.mustHaveValue) {
              conditionsPassed = false
            }
          }
          if (displayRule.mustNotHave) {
            if (!displayRule.mustNotHaveValue) { displayRule.mustNotHaveValue = null }
            if (this.value[conditionField] === displayRule.mustNotHaveValue) {
              conditionsPassed = false
            }
          }
        })
      })
      return conditionsPassed
    },

    saveCallback () {
      this.saveFormData()
    },

    isParentReferenceField (fieldName) {
      if (!this.parentId || !this.parentModule) { return false }
      return this.modules[this.parentModule].singular === fieldName || fieldName === 'referenceModule'
    },

    showInForm (field, fieldName) {
      let hideSubTableReferenceField = false
      if (this.parentId) {
        let singularParentObjectName = this.modules[this.parentModule].singular
      }
      return !hideSubTableReferenceField
    },
  },
}
</script>

<style lang="scss">
/* Overwrite vuetify style */
.v-input__append-outer {
  .v-icon.v-icon {
    font-size: 14px;
  }
}
</style>
