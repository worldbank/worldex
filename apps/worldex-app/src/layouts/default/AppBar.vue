<template>
  <v-app-bar flat>
    <v-app-bar-title>
      <v-row>
        <v-col md="3">
          <h1><v-icon icon="mdi-circle-slice-6" />WorldEx</h1>
        </v-col>
        <v-col md="9">
          <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details></v-text-field>
        </v-col>
      </v-row>
    </v-app-bar-title>
  </v-app-bar>
</template>

<script setup>
  //
</script>
