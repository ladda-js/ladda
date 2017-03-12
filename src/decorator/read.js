import {get as getFromEs,
        put as putInEs,
        contains as inEs} from 'entity-store';
import {get as getFromQc,
        invalidate,
        put as putInQc,
        contains as inQc,
        getValue} from 'query-cache';
import {passThrough, compose} from 'fp';
import {addId, removeId} from 'id-helper';

const getTtl = e => e.ttl * 1000;

// Entity -> Int -> Bool
const hasExpired = (e, timestamp) => {
    return (Date.now() - timestamp) > getTtl(e);
};

const decorateReadSingle = (c, es, qc, e, aFn) => {
    return (id) => {
        if (inEs(es, e, id) && !aFn.alwaysGetFreshData) {
            const v = getFromEs(es, e, id);
            if (!hasExpired(e, v.timestamp)) {
                return Promise.resolve(removeId(v.value));
            }
        }

        return aFn(id).then(passThrough(compose(putInEs(es, e), addId(c, aFn, id))))
                      .then(passThrough(() => invalidate(qc, e, aFn)));
    };
};

const decorateReadQuery = (c, es, qc, e, aFn) => {
    return (...args) => {
        if (inQc(qc, e, aFn, args) && !aFn.alwaysGetFreshData) {
            const v = getFromQc(qc, e, aFn, args);
            if (!hasExpired(e, v.timestamp)) {
                return Promise.resolve(removeId(getValue(v.value)));
            }
        }

        return aFn(...args)
                   .then(passThrough(compose(putInQc(qc, e, aFn, args), addId(c, aFn, args))))
                   .then(passThrough(() => invalidate(qc, e, aFn)));
    };
};

export function decorateRead(c, es, qc, e, aFn) {
    if (aFn.byId) {
        return decorateReadSingle(c, es, qc, e, aFn);
    } else {
        return decorateReadQuery(c, es, qc, e, aFn);
    }
}
