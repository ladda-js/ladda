import { build } from './builder';
import { observable } from './plugins/observable';
import { denormalizer } from './plugins/denormalizer';

module.exports = {
  build,
  plugins: {
    observable,
    denormalizer
  }
};
