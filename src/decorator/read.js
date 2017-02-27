import {get, put, contains} from 'entity-store';
import {query} from 'query-cache';
import {passThrough} from 'fp';

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

        return aFn(...args).then(passThrough(put(es, e)));
    };
};

const decorateReadQuery = (es, qc, e, aFn) => {
    return (...args) => {
        return query(qc, e, aFn, args);
    };
};

export function decorateRead(es, qc, e, aFn) {
    if (aFn.byId) {
        return decorateReadSingle(es, qc, e, aFn);
    } else {
        return decorateReadQuery(es, qc, e, aFn);
    }
}
