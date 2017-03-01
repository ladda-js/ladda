import {put} from 'entity-store';
import {invalidate} from 'query-cache';
import {passThrough} from 'fp';

export function decorateUpdate(es, qc, e, aFn) {
    return (eValue, ...args) => {
        put(es, e, eValue);
        return aFn(eValue, ...args)
            .then(passThrough(() => invalidate(qc, e, aFn)));
    };
}
