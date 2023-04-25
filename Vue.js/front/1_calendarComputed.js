import moment from 'moment'
import helper from '@/methods/helper'

export default {
  selectedYearAndMonth: {
    get () {
      return this.selectedYear + ' ' + this.selectedMonth
    },
    set (value) {
      this.selectedYear = value.year
      this.selectedMonth = value.month
    },
  },

  yearsAndMonths () {
    const data = []
    this.years.forEach(year => {
      this.months.forEach(month => {
        data.push({
          text: helper.firstLetterUppercase(month.name) + ' ' + year,
          value: year + ' ' + month.number,
          year,
          month: month.number,
        })
      })
    })
    return data.filter(val => {
      return moment(val.year + '-' + val.month + '-01').add(1, 'month').isAfter()
    })
  },

  years () {
    return [
      moment().format('Y'),
      parseInt(moment().format('Y')) + 1,
      parseInt(moment().format('Y')) + 2
    ]
  },

  months () {
    moment.locale(this.lang)
    const months = []
    for (let i = 1; i <= 12; i++) {
      const monthNumber = i.toString().length === 1 ? '0' + i.toString() : i.toString()
      months.push({
        number: moment('2000-' + monthNumber + '-01').format('MM'),
        name: moment('2000-' + monthNumber + '-01').format('MMMM')
      })
    }
    return months
  },

  // Return days in the month with additional info to visualize the calendar for the user
  monthWeekDays () {
    moment.locale(this.lang)
    const firstWeekMonday = moment(this.firstDay).startOf('isoWeek').format('YYYY-MM-DD')
    const selectedMonthFirstDay = moment(this.computedYear + '-' + this.computedMonth + '-01')
    const selectedMonthNumber = selectedMonthFirstDay.format('M')

    const maxWeeks = 6
    const monthWeekDays = {}
    let monday = moment(firstWeekMonday)
    for (let j = 0; j <= maxWeeks; j++) {
      const sunday = moment(monday.format('YYYY-MM-DD')).add(6, 'days')
      const weekDays = {}

      if (monday.format('MM') === this.computedMonth || sunday.format('MM') === this.computedMonth) {
        for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
          const day = moment(monday.format('YYYY-MM-DD')).add(dayOfWeek, 'days')
          const isSelected = day.format('DD.MM.YYYY') === this.searchFilters.dateStart ||
            (this.searchFilters.dateStart && this.searchFilters.dateEnd &&
              day >= moment(helper.dateToYMD(this.searchFilters.dateStart)) &&
              day <= moment(helper.dateToYMD(this.searchFilters.dateEnd))
            )
          weekDays[dayOfWeek] = {
            day: day,
            isSelected: isSelected,
            dayDate: day.format('YYYY-MM-DD'),
            dayOfWeek: dayOfWeek,
            dayText: day.format('LL'),
            dayNumber: day.format('DD'),
            sameMonth: day.format('M') === selectedMonthNumber,
            passed: day.isBefore(moment().startOf('day').format()),
            today: day.format('DD-MM-YYYY') === moment().format('DD-MM-YYYY')
          }
        }
      }
      if (Object.keys(weekDays).length > 0) {
        monthWeekDays[j] = weekDays
      }
      monday = moment(sunday.format('YYYY-MM-DD')).add(1, 'day')
    }
    return monthWeekDays
  },
}
