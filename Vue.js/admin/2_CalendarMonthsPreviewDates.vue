<template>
  <v-row wrap>
    <template
      v-for="(e, i) in [...Array(months)]"
    >
      <v-col :key="i" cols="3" class="text-left">
        <v-btn v-if="i === 0" icon @click="navPrevMonth">
          <v-icon>fa-arrow-left</v-icon>
        </v-btn>
      </v-col>
      <v-col :key="i + '_2'"  cols="6" class="text-center month-title">
        <b>{{ monthName(monthFirstDay(i)) }}</b>
      </v-col>
      <v-col :key="i + '_3'" cols="3" class="text-right">
        <v-btn v-if="i === 0" icon @click="navNextMonth">
          <v-icon>fa-arrow-right</v-icon>
        </v-btn>
      </v-col>
      <v-col
        cols="12"
        :key="i + '_4'"
      >
        <v-calendar
          color="primary"
          :value="monthFirstDay(i)"
          :locale="$store.state.language"
          weekdays="1,2,3,4,5,6,0"
        >
          <template v-slot:day-label="{ present, hasTime, day, date }">
            <v-row
              class="fill-height"
            >
              <v-sheet
                :style="!startDates[date] ? 'background: none !important;' : ''"
                :color="startDates[date] ? colorFromCount(startDates[date]) : ''"
                width="100%"
                height="100%"
                tile
                >
                {{ day }}
                </v-sheet>
            </v-row>
          </template>
        </v-calendar>
      </v-col>
    </template>
  </v-row>
</template>

<script>
import moment from 'moment'

export default {
  name: 'CalendarMonthsPreviewDates',

  data () {
    return {
      startMonth: moment().format('MM'),
      startYear: moment().format('YYYY'),
    }
  },

  props: {
    items: {
      type: Array,
      default: () => {
        return []
      },
    },

    fields: {
      type: Array,
      default: () => {
        return []
      }
    },
  },

  computed: {
    months () {
      return Math.floor((this.$store.state.innerHeight - 160) / 250) || 1
    },

    events () {
      let events = this.items.filter(item => item.dateStart && item.dateEnd)
        .map(item => {
          return {
            name: item.customerName,
            start: moment(item.dateStart).format('YYYY-MM-DD'),
            end: moment(item.dateEnd).format('YYYY-MM-DD'),
            color: 'orange'
          }
        })
      return events
    },

    startDates () {
      let dates = {}
      this.items
        .forEach(item => {
          if (!item.dateStart) { return }
          let date = moment(item.dateStart).format('YYYY-MM-DD')
          if (!dates[date]) { dates[date] = 0 }
          dates[date]++
        })
      return dates
    }
  },

  methods: {
    monthName (date) {
      moment.locale(this.$store.state.language)
      return moment(date).format('MMMM YYYY')
    },

    colorFromCount (count) {
      let i = count >= 4 ? 1 : (5 - count)
      return 'green lighten-' + i
    },

    monthFirstDay (i) {
      return moment(this.startYear + '-' + this.startMonth + '-01')
        .add(i, 'months')
        .format('YYYY-MM-DD')
    },

    navPrevMonth () {
      const newDate = moment(this.monthFirstDay(0)).subtract(this.months, 'months')
      this.startMonth = newDate.format('MM')
      this.startYear = newDate.format('YYYY')
    },

    navNextMonth () {
      const newDate = moment(this.monthFirstDay(0)).add(this.months, 'months')
      this.startMonth = newDate.format('MM')
      this.startYear = newDate.format('YYYY')
    }
  }
}
</script>

<style scoped>
.month-title {
  line-height: 36px;
}
</style>
