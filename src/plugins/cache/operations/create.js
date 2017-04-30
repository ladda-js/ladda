import {passThrough, compose} from 'ladda-fp';
import {storeEntity, invalidateQuery} from '../cache';
import {addId} from '../id-helper';

export function decorateCreate(c, cache, notify, e, aFn) {
  return (...args) => {
    return aFn(...args)
      .then(passThrough(() => invalidateQuery(cache, e, aFn)))
      .then(passThrough(compose(storeEntity(cache, e), addId(c, aFn, args))))
      .then(passThrough(notify('CREATE', args)));
  };
}
