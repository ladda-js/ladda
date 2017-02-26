import {get, put, contains} from 'entity-store';
import {query} from 'query-cache';

const getTtl = e => e.ttl;

// Entity -> Int -> Bool
const hasExpired = (e, timestamp) => {
    return (Date.now() - timestamp) > getTtl(e);
};

const decorateReadSingle = (es, qc, e, aFn) => {
    return (...args) => {
        if (contains(es, e, args)) {
            const v = get(es, e, args);
            if (!hasExpired(e, v.timestamp)) {
                return Promise.resolve(v.value);
            }
        }

        const p = aFn(...args);
        p.then(put(es, e));
        return p;
    };
};

const decorateReadPlural = (es, qc, e, aFn) => {
    return (...args) => {
        return query(qc, e, aFn, args);
    };
};

export function decorateRead(es, qc, e, aFn) {
    if (aFn.plural) {
        return decorateReadPlural(es, qc, e, aFn);
    } else {
        return decorateReadSingle(es, qc, e, aFn);
    }
}
