import {passThrough} from 'ladda-fp';
import {remove} from './entity-store';
import {invalidate} from './query-cache';
import {serialize} from './serializer';

export function decorateDelete(c, es, qc, e, aFn) {
  return (...args) => {
    return aFn(...args)
      .then(passThrough(() => invalidate(qc, e, aFn)))
      .then(() => remove(es, e, serialize(args)));
  };
}
