<template>
  <v-app-bar flat>
    <v-app-bar-title>
      <v-row>
        <v-col md="2">
          <h1><v-icon icon="mdi-circle-slice-6" />WorldEx</h1>
        </v-col>
        <v-col md="10">
          <v-text-field class="main-search" v-model="search" append-inner-icon="mdi-magnify" label="Search" single-line
            hide-details></v-text-field>
        </v-col>
      </v-row>
    </v-app-bar-title>
  </v-app-bar>
</template>

<script setup>
  //
</script>

<style>
.main-search {
  padding-right: 10px;
  border-radius: 10px;
}
</style>