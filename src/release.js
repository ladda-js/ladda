import { build } from './builder';
import { subscriber } from './plugins/subscriber';
import { denormalizer } from './plugins/denormalizer';

module.exports = {
  build,
  plugins: {
    subscriber,
    denormalizer
  }
};
