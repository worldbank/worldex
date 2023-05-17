/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Libraries
import axios from 'axios'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Libraries
import config from './config'
import compute from './compute'
import h3const from './h3const'

// Styles
// import 'leaflet/dist/leaflet.css';

const app = createApp(App)

registerPlugins(app)

// Register global properties after installing plugins
app.config.globalProperties.$http = axios
app.config.globalProperties.$window = window

// Register custom config
app.config.globalProperties.$config = config
app.config.globalProperties.$compute = compute
app.config.globalProperties.$h3const = h3const

app.mount('#app')
