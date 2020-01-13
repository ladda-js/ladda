import * as QueryCache from './query-cache';
import * as EntityStore from './entity-store';

export type Cache = {
  entityStore: EntityStore.EntityStore,
  queryCache: QueryCache.QueryCache
};

export const createCache = (entityConfigs: EntityStore.EntityConfig[]):Cache => {
  const entityStore = EntityStore.createEntityStore(entityConfigs);
  const queryCache = QueryCache.createQueryCache(entityStore);
  return {entityStore, queryCache};
};

function unwrapQueryCache<A extends any[], R>(fn:(qc:QueryCache.QueryCache, ...args:A)=>R) {
  return (cache:{queryCache: QueryCache.QueryCache}, ...args:A) => fn(cache.queryCache, ...args);
}

function unwrapEntityStore<A extends any[], R>(fn:(es:EntityStore.EntityStore, ...args:A)=>R) {
  return (cache:{entityStore: EntityStore.EntityStore}, ...args:A) => (
    fn(cache.entityStore, ...args)
  );
}

export const storeQueryResponse = unwrapQueryCache(QueryCache.put);
export const getQueryResponse = QueryCache.getValue;
export const getQueryResponseWithMeta = unwrapQueryCache(QueryCache.get);
export const containsQueryResponse = unwrapQueryCache(QueryCache.contains);
export const invalidateQuery = unwrapQueryCache(QueryCache.invalidate);
export const hasExpired = unwrapQueryCache(QueryCache.hasExpired);
export const storeCreateEvent = unwrapQueryCache(QueryCache.storeCreateEvent);

export const storeEntity = unwrapEntityStore(EntityStore.put);
export const storeEntities = unwrapEntityStore(EntityStore.mPut);
export const getEntity = unwrapEntityStore(EntityStore.get);
export const removeEntity = unwrapEntityStore(EntityStore.remove);
export const containsEntity = unwrapEntityStore(EntityStore.contains);
