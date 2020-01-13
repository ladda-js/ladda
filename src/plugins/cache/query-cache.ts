/* Handles queries, in essence all GET operations.
 * Provides invalidation and querying. Uses the underlying EntityStore for all actual data.
 * Only ids are stored here.
 */

import { curry } from 'ladda-fp';
import {
  ApiFunctionConfig, CacheValue, Entity, Operation, Value, Config
} from '../../types';
import { EntityStore, get as getFromEs, mPut as mPutInEs } from './entity-store';
import { addId, removeId } from './id-helper';
import { serialize } from './serializer';

interface QueryCacheEntry<T> extends CacheValue<T> {
  createEvents: string[]
}

export type QueryCache = {
  entityStore: EntityStore
  cache: {
    /** For every query, store the entity id/ids */
    [queryKey: string]: QueryCacheEntry<string|string[]>
  }
};

// Entity -> [String] -> String
// const createKey = on2(reduce(join('-')), prop('name'), map(serialize));
const createKey = (entity:Entity, values:any[]) => (
  [entity.name, ...values.map(serialize)].join('-')
);

// Value -> CacheValue
const toCacheValue = <T>(xs:T, createEvents:string[] = []):QueryCacheEntry<T> => (
  {value: xs, timestamp: Date.now(), createEvents }
);

// CacheValue -> Value
const toValue = <T>(c:{value: T}) => c.value;

// Entity -> [ApiFnName]
// const getApiFnNamesWhichUpdateOnCreate = compose(
//   reduce((mem, [fnName, fn]) => (fn.updateOnCreate ? [...mem, fnName] : mem), []),
//   toPairs,
//   prop('api')
// );
const getApiFnNamesWhichUpdateOnCreate = (entity:Entity):string[] => Object.keys(entity.api)
  .filter((fnName) => entity.api[fnName].updateOnCreate);


// QueryCache -> Entity -> ApiFnName
// const getCacheValuesForFn = curry((queryCache, entity, name) => {
//   const key = createKey(entity, [name]);
//   // for fns without arguments: check for direct match
//   // for fns with arguments: check, but ignore the arguments, which are added behind a -
//   const regexp = new RegExp(`^${key}(-|$)`);
//   return compose(
//     reduce((mem, [cacheKey, cacheValue]) => {
//       return regexp.test(cacheKey) ? [...mem, cacheValue] : mem;
//     }, []),
//     toPairs,
//     prop('cache')
//   )(queryCache);
// });
const getCacheValuesForFn = (queryCache: QueryCache, entity: Entity) => (name:string) => {
  const key = createKey(entity, [name]);
  // for fns without arguments: check for direct match
  // for fns with arguments: check, but ignore the arguments, which are added behind a -
  const regexp = new RegExp(`^${key}(-|$)`);
  return Object.entries(queryCache.cache)
    .filter(([cacheKey]) => regexp.test(cacheKey))
    .map(([_, cacheValue]) => cacheValue);
};

// QueryCache -> Entity -> Id -> void
// export const storeCreateEvent = (queryCache, entity, id) => {
//   return compose(
//     map_((cacheValue) => cacheValue.createEvents.push(id)),
//     flatten,
//     map(getCacheValuesForFn(queryCache, entity)),
//     getApiFnNamesWhichUpdateOnCreate
//   )(entity);
// };
export const storeCreateEvent = (queryCache:QueryCache, entity: Entity, id: string) => {
  for (const name of getApiFnNamesWhichUpdateOnCreate(entity)) {
    for (const cacheValue of getCacheValuesForFn(queryCache, entity)(name)) {
      cacheValue.createEvents.push(id);
    }
  }
};

// QueryCache -> String -> Bool
const inCache = (qc:QueryCache, k:string):boolean => !!qc.cache[k];

// QueryCache -> Entity -> String -> CacheValue
// const getFromCache = (qc, e, k) => {
//   const rawValue = toValue(qc.cache[k]);
//   const getValuesFromEs = compose(filter(identity), map(getFromEs(qc.entityStore, e)));
//   const value = Array.isArray(rawValue)
//     ? getValuesFromEs(rawValue)
//     : getFromEs(qc.entityStore, e, rawValue);
//   return {
//     ...qc.cache[k],
//     value
//   };
// };
const getFromCache = <T>(
  qc:QueryCache,
  e:Entity,
  queryKey:string
):CacheValue<undefined|CacheValue<T>|CacheValue<T>[]> => {
  const entityStoreIds = toValue(qc.cache[queryKey]);
  const value = Array.isArray(entityStoreIds)
    ? <QueryCacheEntry<T>[]>entityStoreIds
      .map(id => getFromEs<T>(qc.entityStore, e, id))
      .filter(Boolean)
    : getFromEs<T>(qc.entityStore, e, entityStoreIds);

  return {
    ...qc.cache[queryKey],
    value
  };
};

// QueryCache -> Entity -> ApiFunction -> [a] -> [b] -> [b]
// export const put = curry((qc, e, aFn, args, xs) => {
//   const k = createKey(e, [aFn.fnName, ...args]);
//   if (Array.isArray(xs)) {
//     qc.cache[k] = toCacheValue(map(prop('__ladda__id'), xs));
//   } else {
//     qc.cache[k] = toCacheValue(prop('__ladda__id', xs));
//   }
//   mPutInEs(qc.entityStore, e, Array.isArray(xs) ? xs : [xs]);
//   return xs;
// });
export const put:{
  <V extends Value|Value[]>(qc:QueryCache, e:Entity, aFn:ApiFunctionConfig, args:any[], xs:V):V
} = curry((qc:QueryCache, e:Entity, aFn:ApiFunctionConfig, args:any[], xs:Value|Value[]) => {
  const k = createKey(e, [aFn.fnName, ...args]);
  if (Array.isArray(xs)) {
    qc.cache[k] = toCacheValue(xs.map(x => x.__ladda__id));
  } else {
    qc.cache[k] = toCacheValue(xs.__ladda__id);
  }
  mPutInEs(qc.entityStore, e, Array.isArray(xs) ? xs : [xs]);
  return xs;
});

// (CacheValue | [CacheValue]) -> Promise
export const getValue = <T>(v:{value: T}|{value: T}[]) => {
  return Array.isArray(v) ? v.map(toValue) : toValue(v);
};

// QueryCache -> Entity -> ApiFunction -> [a] -> Bool
export const contains = (qc:QueryCache, e:Entity, aFn:ApiFunctionConfig, args: any[]) => {
  const k = createKey(e, [aFn.fnName, ...args]);
  return inCache(qc, k);
};

// Entity -> Milliseconds
const getTtl = (e:Entity) => e.ttl * 1000;

// QueryCache -> Entity -> CacheValue -> Bool
export const hasExpired = (qc:QueryCache, e:Entity, cv:{timestamp: number}) => (
  (Date.now() - cv.timestamp) > getTtl(e)
);

// QueryCache -> Config -> Entity -> ApiFunction -> [a] -> Bool
export const get = <T>(
  qc:QueryCache,
  config: Config,
  e: Entity,
  apiFunction:ApiFunctionConfig,
  args: any[]
) => {
  const k = createKey(e, [apiFunction.fnName, ...args]);
  if (!inCache(qc, k)) {
    throw new Error(
      `Tried to access ${e.name} with key ${k} which doesn't exist.
      Do a contains check first!`
    );
  }
  const plainCacheValue = qc.cache[k];
  while (apiFunction.updateOnCreate && plainCacheValue.createEvents.length) {
    const id = plainCacheValue.createEvents.shift()!;
    const cachedValue = getFromCache<T>(qc, e, k).value;
    if (!Array.isArray(cachedValue)) {
      throw new Error(`Cached entity for ${k} is not an array!`);
    }
    const entityValue = getFromEs<T>(qc.entityStore, e, id);
    if (!entityValue) {
      // the item might have been deleted in the meantime
      continue; // eslint-disable-line no-continue
    }
    // const getVal = compose(removeId, getValue);
    const getVal:{
      <T>(x:{value: T}):T
      <T>(xs:{value: T}[]):T[]
    } = (x:any) => removeId(getValue(x)) as any;
    const nextEntities = apiFunction.updateOnCreate(args, getVal(entityValue), getVal(cachedValue));
    if (!nextEntities) {
      continue; // eslint-disable-line no-continue
    }
    const nextEntitiesWithIds:Value[] = addId(config, apiFunction, args, nextEntities);
    const nextCachedValue = toCacheValue(
      nextEntitiesWithIds.map(v => v.__ladda__id),
      plainCacheValue.createEvents
    );
    qc.cache[k] = nextCachedValue;
  }
  return getFromCache<T>(qc, e, k);
};

// Entity -> Operation -> Bool
const shouldInvalidateEntity = (e: Entity, op?: Operation) => {
  const {invalidatesOn} = e;
  return !!(invalidatesOn && op && invalidatesOn.indexOf(op) > -1);
};

// QueryCache -> String -> ()
const invalidateEntity = (qc:QueryCache, entityName: string) => {
  for (const key in qc.cache) {
    if (key.startsWith(entityName)) {
      delete qc.cache[key];
    }
  }
};

// Object -> [String]
const getInvalidates = (x:{invalidates:string[]}) => x.invalidates;

// QueryCache -> Entity -> ApiFunction -> ()
const invalidateBasedOnEntity = (qc:QueryCache, e:Entity, aFn:ApiFunctionConfig) => {
  if (shouldInvalidateEntity(e, aFn.operation)) {
    for (const entityName of getInvalidates(e)) {
      invalidateEntity(qc, entityName);
    }
  }
};

// QueryCache -> Entity -> ApiFunction -> ()
const invalidateBasedOnApiFn = (qc:QueryCache, e:Entity, aFn:ApiFunctionConfig) => {
  for (const entityName of getInvalidates(aFn)) {
    invalidateEntity(qc, `${e.name}-${entityName}`);
  }
};

// QueryCache -> Entity -> ApiFunction -> ()
export const invalidate = (qc:QueryCache, e:Entity, aFn:ApiFunctionConfig) => {
  invalidateBasedOnEntity(qc, e, aFn);
  invalidateBasedOnApiFn(qc, e, aFn);
};

// EntityStore -> QueryCache
export const createQueryCache = (es:EntityStore):QueryCache => {
  return {entityStore: es, cache: {}};
};
