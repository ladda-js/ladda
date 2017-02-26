import {remove} from 'entity-store';
import {invalidate} from 'query-cache';

export function decorateDelete(es, qc, e, aFn) {
    return (...args) => {
        remove(es, e, args.join(''));
        const p = aFn(...args);
        p.then(() => invalidate(qc, e, aFn));
        return p;
    };
}
