import {put} from 'entity-store';
import {invalidate} from 'query-cache';
import {passThrough, compose} from 'fp';
import {addId} from 'id-helper';

export function decorateCreate(es, qc, e, aFn) {
    return (...args) => {
        return aFn(...args)
            .then(passThrough(compose(put(es, e), addId(aFn, args))))
            .then(passThrough(() => invalidate(qc, e, aFn)));
    };
}
