import {remove} from '../entity-store';
import {invalidate} from '../query-cache';
import {passThrough} from '../fp';
import {serialize} from '../serializer';

export function decorateDelete(c, es, qc, e, aFn) {
  return (...args) => {
    remove(es, e, serialize(args));
    return aFn(...args)
      .then(passThrough(() => invalidate(qc, e, aFn)));
  };
}
