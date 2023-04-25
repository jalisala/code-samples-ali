<template>
  <v-col class="shrink app-sidebar app-sidebar-left">
    <SearchForm v-if="!$store.state.showArticleOnly" />
    <Banners v-if="!['homewlang', 'home'].includes($route.name)" />
    <ContactBanner />
    <FacebookFrame v-if="doNotShow" />
    <MainShare />
    <DynamicAutoHeightInfoBox v-if="['homewlang', 'home'].includes($route.name)" />
  </v-col>
</template>

<script>
import SearchForm from '@/components/Forms/SearchForm'
import FacebookFrame from '@/components/App/Extras/_FacebookFrame'
import MainShare from '@/components/App/Extras/_MainShare'
import Banners from '@/components/App/Extras/_Banners'
import ContactBanner from '@/components/App/Extras/_ContactBanner'
import DynamicAutoHeightInfoBox from '@/components/App/DynamicAutoHeightInfoBox'
import sharedComputed from '@/methods/sharedComputed'

export default {
  name: 'DesktopLeftSidebar',

  components: {
    DynamicAutoHeightInfoBox,
    ContactBanner,
    Banners,
    MainShare,
    FacebookFrame,
    SearchForm,
  },

  computed: {
    ...sharedComputed,
  },

  data () {
    return {
      doNotShow: true,
    }
  },
}
</script>
