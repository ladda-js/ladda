import {mapObject, mapValues, compose, map, toObject, prop} from './fp';
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

// Config -> Api
export const build = (c) => {
    const entities = mapObject(toEntity, c);
    const entityStore = createEntityStore(entities);
    const queryCache = createQueryCache(entityStore);
    const createApi = compose(toApi, map(decorate(entityStore, queryCache)));

    return createApi(entities);
};
