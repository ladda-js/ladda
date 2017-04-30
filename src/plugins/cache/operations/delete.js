import {passThrough} from 'ladda-fp';
import * as Cache from '../cache';
import {serialize} from '../serializer';

export function decorateDelete(c, cache, notify, e, aFn) {
  return (...args) => {
    return aFn(...args)
      .then(passThrough(() => Cache.invalidateQuery(cache, e, aFn)))
      .then(() => Cache.removeEntity(cache, e, serialize(args)));
  };
}
