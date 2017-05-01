import {passThrough} from 'ladda-fp';
import {invalidateQuery} from '../cache';

export function decorateNoOperation(c, cache, notify, e, aFn) {
  return (...args) => {
    return aFn(...args)
      .then(passThrough(() => invalidateQuery(cache, e, aFn)))
      .then(passThrough(() => notify(args, null)));
  };
}
