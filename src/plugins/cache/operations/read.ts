import {
  ApiFunction, ApiFunctionConfig, Config, Entity, Value
} from '../../../types';
import * as Cache from '../cache';
import { addId, removeId } from '../id-helper';

const readFromCache = <T>(cache: Cache.Cache, e: Entity, aFn: ApiFunctionConfig, id:string) => {
  if (Cache.containsEntity(cache, e, id) && !aFn.alwaysGetFreshData) {
    const storeValue = Cache.getEntity<T>(cache, e, id)!;
    // Here we're asking the query cache if a value from the entity store has expired?
    // The hasExpired method is actually generic and works for both EntityStore and QueryCache
    // not just the QueryCache where it's defined
    if (!Cache.hasExpired(cache, e, storeValue)) {
      return removeId(storeValue.value) as T;
    }
  }
  return undefined;
};

const decorateReadSingle = <R, A extends [string]>(
  c:Config,
  cache:Cache.Cache,
  notify:(args: A, result:R)=>void,
  e:Entity,
  aFn:ApiFunction<R, A>
) => {
  return async(id:string) => {
    const fromCache = readFromCache<R>(cache, e, aFn, id);
    if (fromCache) {
      return fromCache;
    }

    // @ts-ignore variance issue that won't be a problem in practice
    const r = await aFn(id);
    Cache.storeEntity(cache, e, addId(c, aFn, id, r));
    Cache.invalidateQuery(cache, e, aFn);
    // @ts-ignore variance issue that won't be a problem in practice
    notify([id], r);
    return r;
  };
};

const decorateReadSome = <R, A extends [string[]]>(
  c:Config,
  cache: Cache.Cache,
  notify: (args:A, r:R[])=>void,
  e:Entity,
  aFn:ApiFunction<R[], A>
) => {
  return async(ids: string[]) => {
    const results:R[] = [];
    const uncachedIds:string[] = [];
    const byId:{[id:string]: R} = {};
    for (const id of ids) {
      const fromCache = readFromCache<R>(cache, e, aFn, id);
      if (fromCache) {
        results.push(fromCache);
        byId[id] = fromCache;
      } else {
        uncachedIds.push(id);
      }
    }

    if (!uncachedIds.length) {
      return results;
    }

    // @ts-ignore variance issue that won't be a problem in practice
    const other = await aFn(uncachedIds);
    // 2 potential problems that were present in the original code:
    // - This assumes that the ids are in the same order as the results (the original zipped the
    //   uncached ids with the `other`).
    // - It also assumes that the ids that were passed as arguments are how we determine the ids
    //   of the objects, but aFn could configure `addId` to take the id from the item, not the
    //   `uncachedIds[i]`
    const resultsWithId = other.map((item:R, i:number):Value => {
      byId[uncachedIds[i]] = item;
      return addId(c, aFn, uncachedIds[i], item);
    });
    Cache.storeEntities(cache, e, resultsWithId);
    Cache.invalidateQuery(cache, e, aFn);

    const completeResults = ids.map(id => byId[id]);
    // @ts-ignore variance issue that won't be a problem in practice
    notify([uncachedIds], completeResults);
    return completeResults;
  };
};

const decorateReadQuery = <R, A extends any[]>(
  c: Config,
  cache: Cache.Cache,
  notify: (args: A, r:R)=>void,
  e: Entity,
  aFn: ApiFunction<R, A>
) => {
  return async(...args:A) => {
    if (Cache.containsQueryResponse(cache, e, aFn, args) && !aFn.alwaysGetFreshData) {
      const v = Cache.getQueryResponseWithMeta<R>(cache, c, e, aFn, args);
      if (!Cache.hasExpired(cache, e, v)) {
        return v.value
          ? removeId(Cache.getQueryResponse(v.value))
          : null;
      }
    }

    const r = await aFn(...args);
    Cache.storeQueryResponse(cache, e, aFn, args, addId(c, aFn, args, r));
    Cache.invalidateQuery(cache, e, aFn);
    notify(args, r);
    return r;
  };
};

export function decorateRead<R, A extends any[]>(
  c:Config,
  cache:Cache.Cache,
  notify: (args: A, r:R)=>void,
  e:Entity,
  aFn: ApiFunction<R, A>
) {
  if (aFn.byId) {
    // @ts-ignore variance issue that won't be a problem in practice
    return decorateReadSingle<R, [string]>(c, cache, notify, e, aFn);
  }
  if (aFn.byIds) {
    // @ts-ignore variance issue that won't be a problem in practice
    return decorateReadSome<R, [string[]]>(c, cache, notify, e, aFn);
  }
  return decorateReadQuery<R, A>(c, cache, notify, e, aFn);
}
