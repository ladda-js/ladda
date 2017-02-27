import {put} from 'entity-store';
import {invalidate} from 'query-cache';
import {passThrough} from 'fp';

export function decorateCreate(es, qc, e, aFn) {
    return (...args) => {
        return aFn(...args)
            .then(passThrough(put(es, e)))
            .then(passThrough(() => invalidate(qc, e, aFn)));
    };
}
