import {map, mapObject, mapValues, compose, toObject, reduce, fromPairs,
        toPairs, prop, filterObject, isEqual, not, curry, copyFunction
      } from 'ladda-fp';

import {cachePlugin} from './plugins/cache/index';
import {dedupPlugin} from './plugins/dedup/index';
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
        // As apiFn name we use key of the api field and not the name of the
        // fn directly. This is controversial. Decision was made because
        // the original function name might be polluted at this point, e.g.
        // containing a "bound" prefix.
        (apiM, [apiFnName, apiFn]) => {
          const getFn = compose(prop(apiFnName), prop('api'));
          apiM[apiFnName] = hoistMetaData(getFn(entity), fn({ entity, fn: apiFn }));
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
    invalidatesOn: ['CREATE', 'UPDATE', 'DELETE', 'COMMAND'],
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

  const setFnName = ([name, apiFn]) => {
    apiFn.fnName = name;
    return [name, apiFn];
  };

  const mapApi = compose(
    fromPairs,
    map(setFnName),
    toPairs,
    mapValues(setDefaults)
  );

  return {
    ...ec,
    api: ec.api ? mapApi(ec.api) : ec.api
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
  strictMode: true,
  ...(config.__config || {})
});

const applyPlugin = curry((addChangeListener, config, entityConfigs, plugin) => {
  const pluginDecorator = plugin({ addChangeListener, config, entityConfigs });
  return mapApiFunctions(pluginDecorator, entityConfigs);
});

const createPluginList = (core, plugins) => {
  return plugins.length ?
    [core, dedupPlugin, ...plugins, dedupPlugin] :
    [core, dedupPlugin];
};

// Config -> Api
export const build = (c, ps = []) => {
  const config = getGlobalConfig(c);
  const entityConfigs = getEntityConfigs(c);
  validateConfig(console, entityConfigs, config);
  const listenerStore = createListenerStore(config);
  const applyPlugin_ = applyPlugin(listenerStore.addChangeListener, config);
  const applyPlugins = reduce(applyPlugin_, entityConfigs);
  const createApi = compose(toApi, applyPlugins);
  return createApi(createPluginList(cachePlugin(listenerStore.onChange), ps));
};
