import {mapObject, mapValues, compose, map, toObject, prop, filterObject, isEqual, not} from './fp';
import {createEntityStore} from './entity-store';
import {createQueryCache} from './query-cache';
import {decorate} from './decorator';

// [[EntityName, EntityConfig]] -> Entity
const toEntity = ([name, c]) => ({
    name,
    ...c
});

// [Entity] -> Api
const toApi = compose(mapValues(prop('api')), toObject(prop('name')));

// Config -> Map String EntityConfig
const getEntityConfigs = filterObject(compose(not, isEqual('__config')));

// Config -> Api
export const build = (c) => {
    const config = c.__config || {idField: 'id'};
    const entityConfigs = getEntityConfigs(c);
    const entities = mapObject(toEntity, entityConfigs);
    const entityStore = createEntityStore(entities);
    const queryCache = createQueryCache(entityStore);
    const createApi = compose(toApi, map(decorate(config, entityStore, queryCache)));

    return createApi(entities);
};
