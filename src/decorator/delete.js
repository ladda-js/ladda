import {remove} from 'entity-store';
import {invalidate} from 'query-cache';
import {passThrough} from 'fp';

export function decorateDelete(es, qc, e, aFn) {
    return (...args) => {
        remove(es, e, args.join(''));
        return aFn(...args)
                   .then(passThrough(() => invalidate(qc, e, aFn)));
    };
}
