import {passThrough} from 'ladda-fp';
import {invalidateQuery} from '../cache';

export function decorateNotifier(c, cache, e, aFn) {
  return (...args) => {
    return aFn(...args)
          .then(passThrough(() => invalidateQuery(cache, e, aFn)));
  };
}
