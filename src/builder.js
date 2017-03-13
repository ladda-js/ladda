import {mapObject, mapValues, compose, map, toObject,
        prop, filterObject, isEqual, not, curry, copyFunction} from './fp';
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

// EntityConfig -> EntityConfig
const setEntityConfigDefaults = ec => {
  return {
    ttl: 300,
    invalidates: [],
    invalidatesOn: ['CREATE', 'UPDATE', 'DELETE'],
    ...ec
  };
};

// EntityConfig -> EntityConfig
const setApiConfigDefaults = ec => {
  const defaults = {
    operation: 'NO_OPERATION',
    invalidates: [],
    idFrom: 'ENTITY',
    byId: false
  };

  const writeToObjectIfNotSet = curry((o, [k, v]) => {
    if (!o.hasOwnProperty(k)) {
      o[k] = v;
    }
  });
  const setDefaults = apiConfig => {
    const copy = copyFunction(apiConfig);
    mapObject(writeToObjectIfNotSet(copy), defaults);
    return copy;
  };

  return {
    ...ec,
    api: mapValues(setDefaults, ec.api)
  };
};

// Config -> Map String EntityConfig
const getEntityConfigs = compose(
  mapValues(setApiConfigDefaults),
  mapValues(setEntityConfigDefaults),
  filterObject(compose(not, isEqual('__config')))
);

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
