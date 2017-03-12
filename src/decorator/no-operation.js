import {invalidate} from 'query-cache';
import {passThrough} from 'fp';

export function decorateNoOperation(c, es, qc, e, aFn) {
    return (...args) => {
        return aFn(...args)
                   .then(passThrough(() => invalidate(qc, e, aFn)));
    };
}
