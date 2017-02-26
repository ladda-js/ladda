import {put} from 'entity-store';
import {invalidate} from 'query-cache';

export function decorateUpdate(es, qc, e, aFn) {
    return (eValue, ...args) => {
        put(es, e, eValue);
        const p = aFn(eValue, ...args);
        p.then(() => invalidate(qc, e, aFn));
        return p;
    };
}
