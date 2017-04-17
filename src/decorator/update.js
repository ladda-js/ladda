import {put} from '../entity-store';
import {invalidate} from '../query-cache';
import {passThrough} from '../fp';
import {addId} from '../id-helper';

export function decorateUpdate(c, es, qc, e, aFn) {
  return (eValue, ...args) => {
    return aFn(eValue, ...args)
      .then(passThrough(() => invalidate(qc, e, aFn)))
      .then(passThrough(() => put(es, e, addId(c, undefined, undefined, eValue))));
  };
}
