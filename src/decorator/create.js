import {put} from 'entity-store';
import {invalidate} from 'query-cache';

export function decorateCreate(es, qc, e, aFn) {
    return (...args) => {
        const p = aFn(...args);
        p.then(eValue => put(es, e, eValue));
        p.then(() => invalidate(qc, e, aFn));
        return p;
    };
}
