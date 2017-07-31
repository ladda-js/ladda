import {passThrough, compose} from 'ladda-fp';
import {storeEntity, storeCreateEvent, invalidateQuery} from '../cache';
import {addId, getId} from '../id-helper';

export function decorateCreate(c, cache, notify, e, aFn) {
  return (...args) => {
    return aFn(...args)
      .then(passThrough(() => invalidateQuery(cache, e, aFn)))
      .then(passThrough(compose(storeEntity(cache, e), addId(c, aFn, args))))
      .then(passThrough(compose(storeCreateEvent(cache, e), getId(c, aFn, args))))
      .then(passThrough(notify(args)));
  };
}
