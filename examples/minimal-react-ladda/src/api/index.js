import { build } from 'ladda-cache';
import * as hackernews from './hackernews.js';

const config = {
  hackernews: {
    ttl: 300,
    api: hackernews
  },
};

const api = build(config);

export default api;
