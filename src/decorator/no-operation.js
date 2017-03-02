import {invalidate} from 'query-cache';
import {passThrough} from 'fp';

export function decorateNoOperation(c, es, qc, e, aFn) {
    const newApiFn = aFn.bind(null);
    newApiFn.operation = 'NO_OPERATION';
    return (...args) => {
        return aFn(...args)
                   .then(passThrough(() => invalidate(qc, e, newApiFn)));
    };
}
