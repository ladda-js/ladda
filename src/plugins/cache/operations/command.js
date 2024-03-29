import {passThrough} from 'ladda-fp';
import * as Cache from '../cache';
import {addId} from '../id-helper';

export function decorateCommand(c, cache, notify, e, aFn) {
  return (...args) => {
    return aFn(...args)
      .then(passThrough(() => Cache.invalidateQuery(cache, e, aFn)))
      .then(passThrough((o) => Cache.storeEntities(cache, e, addId(c, undefined, undefined, Array.isArray(o) ? o : [o]))))
      .then(passThrough((o) => notify([...args], o)));
  };
}

