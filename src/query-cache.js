/* Handles queries, in essence all GET operations.
 * Provides invalidation and querying. Uses the underlying EntityStore for all actual data.
 * Only ids are stored here.
 * TODO: Move hasExpired and ApiFn logic out to decorator or move from decorator to entity store
 * so that query cache and entity store have similar responsibilities.
 */

import {put, get} from './entity-store';
import {on2, prop, join, reduce, identity, curry, map, map_, startsWith, compose, debug} from 'fp';

// Entity -> [String] -> String
const createKey = on2(reduce(join('-')), prop('name'), identity);

// Value -> CacheValue
const toCacheValue = xs => ({value: xs, timestamp: Date.now()});

// CacheValue -> Value
const toValue = prop('value');

// Entity -> Int
const getTtl = e => e.ttl || 0;

// QueryCache -> String -> Bool
const inCache = (qc, k) => !!qc.cache[k];

// QueryCache -> Entity -> String -> CacheValue
const getFromCache = (qc, e, k) => {
    const rawValue = toValue(qc.cache[k]);
    return Array.isArray(rawValue)
        ? map(get(qc.entityStore, e), toValue(qc.cache[k]))
        : get(qc.entityStore, e, toValue(qc.cache[k]));
};

// QueryCache -> Entity -> String -> Int
const getExpireForQuery = (qc, e, k) => {
    return qc.cache[k].timestamp;
};

// Entity -> Int -> Bool
const hasExpired = (e, expire) => {
    return (Date.now() - expire) > getTtl(e);
};

// QueryCache -> Entity -> String -> Promise -> Promise
const saveInCache = curry((qc, e, k, xs) => {
    if (Array.isArray(xs)) {
        qc.cache[k] = toCacheValue(map(prop('id'), xs));
    } else {
        qc.cache[k] = toCacheValue(prop('id', xs));
    }
    map_(put(qc.entityStore, e), Array.isArray(xs) ? xs : [xs]);
    return xs;
});

// Entity -> Value -> Int -> ApiFunction -> Promise
const getValue = (e, v, expire, getFromApi) => {
    if (hasExpired(e, expire)) {
        return getFromApi();
    } else {
        return Promise.resolve(toValue(v));
    }
};

// QueryCache -> Entity -> ApiFunction -> Args -> Value
export const query = (qc, e, aFn, args) => {
    const k = createKey(e, [aFn.name, ...args]);
    const getFromApi = () => aFn(...args).then(saveInCache(qc, e, k));
    if (!inCache(qc, k)) {
        return getFromApi();
    } else {
        const v = getFromCache(qc, e, k);
        const expire = getExpireForQuery(qc, e, k);
        return getValue(e, v, expire, getFromApi);
    }
};

// Entity -> Operation -> Bool
const shouldInvalidateEntity = (e, op) => {
    return e.invalidatesOn && e.invalidatesOn.indexOf(op) > -1;
};

// QueryCache -> String -> ()
const invalidateEntity = curry((qc, entityName) => {
    const keys = Object.keys(qc.cache);
    const removeIfEntity = k => {
        if (startsWith(entityName + '-', k)) {
            delete qc.cache[k];
        }
    };
    map_(removeIfEntity, keys);
});

// QueryCache -> Entity -> Operation -> ()
const invalidateBasedOnEntity = (qc, e, aFn) => {
    if (shouldInvalidateEntity(e, aFn.operation)) {
        map_(invalidateEntity(qc), e.invalidates);
    }
};

// ApiFunction -> [String]
const getInvalidatesFromApiFn = aFn => aFn.invalidates || [];

// QueryCache -> Entity -> ApiFunction -> Operation -> ()
const invalidateBasedOnApiFn = (qc, e, aFn) => {
    const prependEntity = x => `${e.name}-${x}`;
    const invalidateEntityByApiFn = compose(invalidateEntity(qc), prependEntity);
    map_(invalidateEntityByApiFn, getInvalidatesFromApiFn(aFn));
};

// QueryCache -> Entity -> ApiFunction -> Operation -> ()
export const invalidate = (qc, e, aFn) => {
    invalidateBasedOnEntity(qc, e, aFn);
    invalidateBasedOnApiFn(qc, e, aFn);
};

// EntityStore -> QueryCache
export const createQueryCache = (es) => {
    return {entityStore: es, cache: {}};
};
