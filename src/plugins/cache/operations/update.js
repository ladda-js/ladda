import {passThrough} from 'ladda-fp';
import * as Cache from '../cache';
import {addId} from '../id-helper';

export function decorateUpdate(c, cache, notify, e, aFn) {
  return (eValue, ...args) => {
    return aFn(eValue, ...args)
      .then(passThrough(() => Cache.invalidateQuery(cache, e, aFn)))
      .then(() => Cache.storeEntity(cache, e, addId(c, undefined, undefined, eValue)))
      .then(passThrough(() => notify([eValue, ...args], eValue)));
  };
}
