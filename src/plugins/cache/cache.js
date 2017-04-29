import * as QueryCache from './query-cache';
import * as EntityStore from './entity-store';

export const createCache = (entityConfigs, onChange) => {
    const entityStore = EntityStore.createEntityStore(entityConfigs, onChange)
    const queryCache = QueryCache.createQueryCache(entityStore, onChange)
    return {entityStore, queryCache};
};

export const storeQueryResponse = ({queryCache}, ...args) => {
    return QueryCache.put(queryCache, ...args);
};

export const getQueryResponse = QueryCache.getValue;

export const getQueryResponseWithMeta = ({queryCache}, ...args) => {
    return QueryCache.get(queryCache, ...args)
};

export const containsQueryResponse = ({queryCache}, ...args) => {
    return QueryCache.contains(queryCache, ...args)
};

export const invalidateQueryCache = ({queryCache}) => {
    return QueryCache.invalidate(queryCache, ...args)
};

export const storeEntity = ({entityStore}, ...args) => {
    return EntityStore.put(queryCache, ...args)
};

export const storeEntities = ({entityStore}, ...args) => {
    return EntityStore.mPut(queryCache, ...args)
};

export const getEntity = ({entityStore}, ...args) => {
    return EntityStore.get(queryCache, ...args)
};

export const removeEntity = ({entityStore}, ...args) => {
    return EntityStore.remove(queryCache, ...args)
};

export const containsEntity = ({entityStore}, ...args) => {
    return EntityStore.contains(queryCache, ...args)
};
