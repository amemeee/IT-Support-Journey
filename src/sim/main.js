import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import '../styles/style.css';
import '../styles/sim.css';

createApp(App).use(createPinia()).mount('#app');
