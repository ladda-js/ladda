import {mapObject, mapValues, compose, toObject, reduce, toPairs,
        prop, filterObject, isEqual, not, curry, copyFunction
      } from 'ladda-fp';

import {cachePlugin} from './plugins/cache';
import {dedupPlugin} from './plugins/dedup';
import {createListenerStore} from './listener-store';
import {validateConfig} from './validator';

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

const setFnName = curry((name, fn) => {
  Object.defineProperty(fn, 'name', { writable: true });
  fn.name = name;
  Object.defineProperty(fn, 'name', { writable: false });
  return fn;
});

const hoistMetaData = (a, b) => {
  const keys = Object.getOwnPropertyNames(a);
  for (let i = keys.length - 1; i >= 0; i--) {
    const k = keys[i];
    if (!KNOWN_STATICS[k]) {
      b[k] = a[k];
    }
  }
  setFnName(a.name, b);
  return b;
};

export const mapApiFunctions = (fn, entityConfigs) => {
  return mapValues((entity) => {
    return {
      ...entity,
      api: reduce(
        // As apiFn name we use key of the api field and not the name of the
        // fn directly. This is controversial. Decision was made because
        // the original function name might be polluted at this point, e.g.
        // containing a "bound" prefix.
        (apiM, [apiFnName, apiFn]) => {
          const getFn = compose(prop(apiFnName), prop('api'));
          const nextFn = hoistMetaData(getFn(entity), fn({ entity, fn: apiFn }));
          setFnName(apiFnName, nextFn);
          apiM[apiFnName] = nextFn;
          return apiM;
        },
        {},
        toPairs(entity.api)
      )
    };
  }, entityConfigs);
};

// EntityConfig -> Api
const toApi = mapValues(prop('api'));

// EntityConfig -> EntityConfig
const setEntityConfigDefaults = ec => {
  return {
    ttl: 300,
    invalidates: [],
    invalidatesOn: ['CREATE', 'UPDATE', 'DELETE'],
    enableDeduplication: true,
    ...ec
  };
};

// EntityConfig -> EntityConfig
const setApiConfigDefaults = ec => {
  const defaults = {
    operation: 'NO_OPERATION',
    invalidates: [],
    idFrom: 'ENTITY',
    byId: false,
    byIds: false,
    enableDeduplication: true
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
    api: ec.api ? mapValues(setDefaults, ec.api) : ec.api
  };
};

// Config -> Map String EntityConfig
export const getEntityConfigs = compose( // exported for testing
  toObject(prop('name')),
  mapObject(toEntity),
  mapValues(setApiConfigDefaults),
  mapValues(setEntityConfigDefaults),
  filterObject(compose(not, isEqual('__config')))
);

const getGlobalConfig = (config) => ({
  idField: 'id',
  enableDeduplication: true,
  useProductionBuild: process.NODE_ENV === 'production',
  ...(config.__config || {})
});

const applyPlugin = curry((addChangeListener, config, entityConfigs, plugin) => {
  const pluginDecorator = plugin({ addChangeListener, config, entityConfigs });
  return mapApiFunctions(pluginDecorator, entityConfigs);
});

// Config -> Api
export const build = (config, plugins = []) => {
  const globalConfig = getGlobalConfig(config);
  const entityConfigs = getEntityConfigs(config);
  validateConfig(console, entityConfigs, globalConfig);
  const listenerStore = createListenerStore(globalConfig);
  const applyPlugin_ = applyPlugin(listenerStore.addChangeListener, globalConfig);
  const applyPlugins = reduce(applyPlugin_, entityConfigs);
  const createApi = compose(toApi, applyPlugins);
  return createApi([cachePlugin(listenerStore.onChange), ...plugins, dedupPlugin]);
};
