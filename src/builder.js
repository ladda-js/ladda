import {mapObject, mapValues, compose, map, toObject, reduce, toPairs,
        prop, filterObject, isEqual, not, curry, copyFunction} from './fp';
import {createEntityStore} from './entity-store';
import {createQueryCache} from './query-cache';
import {decorate} from './decorator';

// [[EntityName, EntityConfig]] -> Entity
const toEntity = ([name, c]) => ({
  name,
  ...c
});

const KNOWN_STATICS = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  arguments: true,
  arity: true
};

const hoistMetaData = (a, b) => {
  const keys = Object.getOwnPropertyNames(a);
  for (let i = keys.length - 1; i >= 0; i--) {
    const k = keys[i];
    if (!KNOWN_STATICS[k]) {
      b[k] = a[k];
    }
  }
  return b;
};

const hoistApiMetaData = (configs, nextConfigs) => {
  return mapValues((entity) => {
    return {
      ...entity,
      api: reduce((apiM, [fnName, fn]) => {
        const getFn = compose(prop(fnName), prop('api'), prop(entity.name));
        apiM[fnName] = hoistMetaData(getFn(configs), fn);
        return apiM;
      }, {}, toPairs(entity.api))
    };
  }, nextConfigs);
};

const applyPlugin = curry((config, entityConfigs, plugin) => {
  return hoistApiMetaData(entityConfigs, plugin(config, entityConfigs));
});

const stripMetaData = (fn) => (...args) => fn(...args);

// EntityConfig -> Api
const toApi = mapValues(compose(mapValues(stripMetaData), prop('api')));

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

const corePlugin = (config, entityConfigs) => {
  const entities = mapObject(toEntity, entityConfigs);
  const entityStore = createEntityStore(entities);
  const queryCache = createQueryCache(entityStore);
  return compose(
    toObject(prop('name')),
    map(decorate(config, entityStore, queryCache))
  )(entities);
};

// Config -> Api
export const build = (c, ps = []) => {
  const config = c.__config || {idField: 'id'};
  const entityConfigs = getEntityConfigs(c);
  const plugins = [corePlugin, ...ps];
  const createApi = compose(toApi, reduce(applyPlugin(config), entityConfigs));
  return createApi(plugins);
};
