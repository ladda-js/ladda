/* Handles queries, in essence all GET operations.
 * Provides invalidation and querying. Uses the underlying EntityStore for all actual data.
 * Only ids are stored here.
 */

import {on2, prop, join, reduce, identity, toPairs, flatten,
        curry, map, map_, startsWith, compose, filter} from 'ladda-fp';
import {mPut as mPutInEs, put as putInEs, get as getFromEs} from './entity-store';
import {serialize} from './serializer';
import {removeId, addId} from './id-helper';

// Entity -> [String] -> String
const createKey = on2(reduce(join('-')), prop('name'), map(serialize));

// Value -> CacheValue
const toCacheValue = (xs, createEvents = []) => ({value: xs, timestamp: Date.now(), createEvents });

// CacheValue -> Value
const toValue = prop('value');

// Entity -> [ApiFnName]
const getApiFnNamesWhichUpdateOnCreate = compose(
  reduce((mem, [fnName, fn]) => (fn.updateOnCreate ? [...mem, fnName] : mem), []),
  toPairs,
  prop('api')
);

// QueryCache -> Entity -> ApiFnName
const getCacheValuesForFn = curry((queryCache, entity, name) => {
  const key = createKey(entity, [name]);
  // for fns without arguments: check for direct match
  // for fns with arguments: check, but ignore the arguments, which are added behind a -
  const regexp = new RegExp(`^${key}(-|$)`);
  return compose(
    reduce((mem, [cacheKey, cacheValue]) => {
      return regexp.test(cacheKey) ? [...mem, cacheValue] : mem;
    }, []),
    toPairs,
    prop('cache')
  )(queryCache);
});

// QueryCache -> Entity -> Id -> void
export const storeCreateEvent = (queryCache, entity, id) => {
  return compose(
    map_((cacheValue) => cacheValue.createEvents.push(id)),
    flatten,
    map(getCacheValuesForFn(queryCache, entity)),
    getApiFnNamesWhichUpdateOnCreate,
  )(entity);
};

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
  const k = createKey(e, [aFn.fnName, ...args]);
  if (Array.isArray(xs)) {
    qc.cache[k] = toCacheValue(map(prop('__ladda__id'), xs));
  } else {
    qc.cache[k] = toCacheValue(prop('__ladda__id', xs));
  }
  return Array.isArray(xs) ?
    mPutInEs(qc.entityStore, e, xs) :
    putInEs(qc.entityStore, e, xs);
});

// (CacheValue | [CacheValue]) -> Promise
export const getValue = (v) => {
  return Array.isArray(v) ? map(toValue, v) : toValue(v);
};

// QueryCache -> Entity -> ApiFunction -> [a] -> Bool
export const contains = (qc, e, aFn, args) => {
  const k = createKey(e, [aFn.fnName, ...args]);
  return inCache(qc, k);
};

// Entity -> Milliseconds
const getTtl = e => e.ttl * 1000;

// QueryCache -> Entity -> CacheValue -> Bool
export const hasExpired = (qc, e, cv) => (Date.now() - cv.timestamp) > getTtl(e);

// QueryCache -> Config -> Entity -> ApiFunction -> [a] -> Bool
export const get = (qc, c, e, aFn, args) => {
  const k = createKey(e, [aFn.fnName, ...args]);
  if (!inCache(qc, k)) {
    throw new Error(
      `Tried to access ${e.name} with key ${k} which doesn't exist.
      Do a contains check first!`
    );
  }
  const plainCacheValue = qc.cache[k];
  while (aFn.updateOnCreate && plainCacheValue.createEvents.length) {
    const id = plainCacheValue.createEvents.shift();
    const cachedValue = getFromCache(qc, e, k);
    const entityValue = getFromEs(qc.entityStore, e, id);
    if (!entityValue) {
      // the item might have been deleted in the meantime
      continue; // eslint-disable-line no-continue
    }
    const getVal = compose(removeId, getValue);
    const nextEntities = aFn.updateOnCreate(args, getVal(entityValue), getVal(cachedValue.value));
    if (!nextEntities) {
      continue; // eslint-disable-line no-continue
    }
    const nextCachedValue = compose(
      (xs) => toCacheValue(map(prop('__ladda__id'), xs, plainCacheValue.createEvents)),
      addId(c, aFn, args)
    )(nextEntities);
    qc.cache[k] = nextCachedValue;
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
