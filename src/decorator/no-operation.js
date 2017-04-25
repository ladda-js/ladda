import {passThrough} from 'ladda-fp';
import {invalidate} from '../query-cache';

export function decorateNoOperation(c, es, qc, e, aFn) {
  return (...args) => {
    return aFn(...args)
      .then(passThrough(() => invalidate(qc, e, aFn)));
  };
}
