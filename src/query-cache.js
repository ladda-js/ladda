/* Handles queries, in essence all GET operations.
 * Provides invalidation and querying. Uses the underlying EntityStore for all actual data.
 * Only ids are stored here.
 */

import {put as putInEs, get as getFromEs} from './entity-store';
import {on2, prop, join, reduce, identity,
        curry, map, map_, startsWith, compose, filter} from './fp';
import {serialize} from './serializer';

// Entity -> [String] -> String
const createKey = on2(reduce(join('-')), prop('name'), map(serialize));

// Value -> CacheValue
const toCacheValue = xs => ({value: xs, timestamp: Date.now()});

// CacheValue -> Value
const toValue = prop('value');

// QueryCache -> String -> Bool
const inCache = (qc, k) => !!qc.cache[k];

// QueryCache -> Entity -> String -> CacheValue
const getFromCache = (qc, e, k) => {
  const rawValue = toValue(qc.cache[k]);
  const getValuesFromEs = compose(filter(identity), map(getFromEs(qc.entityStore, e)));
  const value = Array.isArray(rawValue)
    ? getValuesFromEs(rawValue)
    : getFromEs(qc.entityStore, e, rawValue);
  return {
    ...qc.cache[k],
    value
  };
};

// QueryCache -> Entity -> ApiFunction -> [a] -> [b] -> [b]
export const put = curry((qc, e, aFn, args, xs) => {
  const k = createKey(e, [aFn.name, ...filter(identity, args)]);
  if (Array.isArray(xs)) {
    qc.cache[k] = toCacheValue(map(prop('__ladda__id'), xs));
  } else {
    qc.cache[k] = toCacheValue(prop('__ladda__id', xs));
  }
  map_(putInEs(qc.entityStore, e), Array.isArray(xs) ? xs : [xs]);
  return xs;
});

// (CacheValue | [CacheValue]) -> Promise
export const getValue = (v) => {
  return Array.isArray(v) ? map(toValue, v) : toValue(v);
};

// QueryCache -> Entity -> ApiFunction -> [a] -> Bool
export const contains = (qc, e, aFn, args) => {
  const k = createKey(e, [aFn.name, ...filter(identity, args)]);
  return inCache(qc, k);
};

// QueryCache -> Entity -> ApiFunction -> [a] -> Bool
export const get = (qc, e, aFn, args) => {
  const k = createKey(e, [aFn.name, ...filter(identity, args)]);
  if (!inCache(qc, k)) {
    throw new Error(
      `Tried to access ${e.name} with key ${k} which doesn't exist.
      Do a contains check first!`
    );
  }
  return getFromCache(qc, e, k);
};

// Entity -> Operation -> Bool
const shouldInvalidateEntity = (e, op) => {
  const invalidatesOn = e.invalidatesOn;
  return invalidatesOn && invalidatesOn.indexOf(op) > -1;
};

// QueryCache -> String -> ()
const invalidateEntity = curry((qc, entityName) => {
  const keys = Object.keys(qc.cache);
  const removeIfEntity = k => {
    if (startsWith(entityName, k)) {
      delete qc.cache[k];
    }
  };
  map_(removeIfEntity, keys);
});

// Object -> [String]
const getInvalidates = x => x.invalidates;

// QueryCache -> Entity -> ApiFunction -> ()
const invalidateBasedOnEntity = (qc, e, aFn) => {
  if (shouldInvalidateEntity(e, aFn.operation)) {
    map_(invalidateEntity(qc), getInvalidates(e));
  }
};

// QueryCache -> Entity -> ApiFunction -> ()
const invalidateBasedOnApiFn = (qc, e, aFn) => {
  const prependEntity = x => `${e.name}-${x}`;
  const invalidateEntityByApiFn = compose(invalidateEntity(qc), prependEntity);
  map_(invalidateEntityByApiFn, getInvalidates(aFn));
};

// QueryCache -> Entity -> ApiFunction -> ()
export const invalidate = (qc, e, aFn) => {
  invalidateBasedOnEntity(qc, e, aFn);
  invalidateBasedOnApiFn(qc, e, aFn);
};

// EntityStore -> QueryCache
export const createQueryCache = (es) => {
  return {entityStore: es, cache: {}};
};
