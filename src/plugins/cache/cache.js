import {curry} from 'ladda-fp';
import * as QueryCache from './query-cache';
import * as EntityStore from './entity-store';

export const createCache = (entityConfigs, globalConfig = {}) => {
  const entityStore = EntityStore.createEntityStore(entityConfigs, globalConfig);
  const queryCache = QueryCache.createQueryCache(entityStore);
  return {entityStore, queryCache};
};

export const storeQueryResponse = ({queryCache}, ...args) => {
  return QueryCache.put(queryCache, ...args);
};

export const getQueryResponse = QueryCache.getValue;

export const getQueryResponseWithMeta = ({queryCache}, ...args) => {
  return QueryCache.get(queryCache, ...args);
};

export const containsQueryResponse = ({queryCache}, ...args) => {
  return QueryCache.contains(queryCache, ...args);
};

export const invalidateQuery = ({queryCache}, ...args) => {
  return QueryCache.invalidate(queryCache, ...args);
};

export const hasExpired = ({queryCache}, ...args) => {
  return QueryCache.hasExpired(queryCache, ...args);
};

export const storeCreateEvent = curry(({queryCache}, entity, id) => {
  return QueryCache.storeCreateEvent(queryCache, entity, id);
});

export const storeEntity = curry(({entityStore}, ...args) => {
  return EntityStore.put(entityStore, ...args);
});

export const storeEntities = ({entityStore}, ...args) => {
  return EntityStore.mPut(entityStore, ...args);
};

export const getEntity = curry(({entityStore}, ...args) => {
  return EntityStore.get(entityStore, ...args);
});

export const removeEntity = ({entityStore}, ...args) => {
  return EntityStore.remove(entityStore, ...args);
};

export const containsEntity = ({entityStore}, ...args) => {
  return EntityStore.contains(entityStore, ...args);
};

