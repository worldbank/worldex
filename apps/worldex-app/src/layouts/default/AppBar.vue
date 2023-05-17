<template>
  <v-app-bar flat style="background-color: #1460aa;">
    <v-app-bar-title>
      <v-row style="color:white;">
        <v-col md="2">
          <h1><v-icon icon="mdi-circle-slice-6" />WorldEx</h1>
        </v-col>
        <v-col md="10">
          <v-text-field class="main-search" variant="outlined" v-model="search" append-inner-icon="mdi-magnify"
            label="Search" single-line @keydown.enter="setSearch" @click:appendInner="setSearch"
            hide-details></v-text-field>
        </v-col>
      </v-row>
    </v-app-bar-title>
  </v-app-bar>
</template>

<script>
//
export default {
  data() {
    return {
      search: '',
    }
  },
  methods: {
    setSearch() {
      this.$router.push({ name: '', query: { search: this.search } })
    }

  }
}
</script>

<style>
.main-search {
  padding-right: 10px;
  border-radius: 10px;
}
</style>