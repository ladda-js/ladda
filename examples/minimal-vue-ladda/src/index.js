import Vue from 'vue';

import api from './api';

new Vue({
  el: '#app',
  template: `<div>{{ hi }}</div>`,
  data: {
    hi: 'Hello Vue.js!'
  }
});
