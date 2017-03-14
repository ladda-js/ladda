import {mapObject, mapValues, compose, toObject, reduce, toPairs,
        prop, filterObject, isEqual, not, curry, copyFunction} from './fp';
import {decorator} from './decorator';

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

export const mapApiFunctions = (fn, entityConfigs) => {
  return mapValues((entity) => {
    return {
      ...entity,
      api: reduce(
        (apiM, [apiFnName, apiFn]) => {
          const getFn = compose(prop(apiFnName), prop('api'));
          const nextFn = fn({ entity, apiFnName, apiFn });
          apiM[apiFnName] = hoistMetaData(getFn(entity), nextFn);
          return apiM;
        },
        {},
        toPairs(entity.api)
      )
    };
  }, entityConfigs);
};

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
  toObject(prop('name')),
  mapObject(toEntity),
  mapValues(setApiConfigDefaults),
  mapValues(setEntityConfigDefaults),
  filterObject(compose(not, isEqual('__config')))
);

const applyPlugin = curry((config, entityConfigs, plugin) => {
  const pluginDecorator = plugin({ config, entityConfigs });
  return mapApiFunctions(pluginDecorator, entityConfigs);
});

// Config -> Api
export const build = (c, ps = []) => {
  const config = c.__config || {idField: 'id'};
  const createApi = compose(toApi, reduce(applyPlugin(config), getEntityConfigs(c)));
  return createApi([decorator, ...ps]);
};
