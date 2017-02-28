import {get as getFromEs,
        put as putInEs,
        contains as inEs} from 'entity-store';
import {get as getFromQc,
        put as putInQc,
        contains as inQc,
        getValue} from 'query-cache';
import {passThrough} from 'fp';

const getTtl = e => (e.ttl || 0) * 1000;

// Entity -> Int -> Bool
const hasExpired = (e, timestamp) => {
    return (Date.now() - timestamp) > getTtl(e);
};

const decorateReadSingle = (es, e, aFn) => {
    return (id) => {
        if (inEs(es, e, id)) {
            const v = getFromEs(es, e, id);
            if (!hasExpired(e, v.timestamp)) {
                return Promise.resolve(v.value);
            }
        }

        return aFn(id).then(passThrough(putInEs(es, e)));
    };
};

const decorateReadQuery = (es, qc, e, aFn) => {
    return (...args) => {
        if (inQc(qc, e, aFn, args)) {
            const v = getFromQc(qc, e, aFn, args);
            if (!hasExpired(e, v.timestamp)) {
                return Promise.resolve(getValue(v.value));
            }
        }

        return aFn(...args).then(passThrough(putInQc(qc, e, aFn, args)));
    };
};

export function decorateRead(es, qc, e, aFn) {
    if (aFn.byId) {
        return decorateReadSingle(es, e, aFn);
    } else {
        return decorateReadQuery(es, qc, e, aFn);
    }
}
