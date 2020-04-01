import { copyFunction } from './fp/index';
import { createListenerStore } from './listener-store';
import { cachePlugin } from './plugins/cache/index';
import { dedupPlugin, DupConfig } from './plugins/dedup/index';
import {
  ApiFunction,
  ApiFunctionConfig,
  ChangeListener,
  Config,
  Entity,
  EntityApi,
  EntityConfigs,
  ExternalConfig,
  Operation,
  Plugin,
  PluginDecorator,
  PartialEntity,
  PartialApiFunction
} from './types';
import { validateConfig } from './validator';


function mapProps<T extends {}, V, S>(
  original: T,
  fn:(value: V, propName:string) => S
) {
  const result:{[propName in keyof T]: S} = {} as any;
  for (const propName in original) {
    if (original.hasOwnProperty(propName)) {
      // @ts-ignore Variance issue that is not a problem in practice
      const value:V = original[propName];
      result[propName] = fn(value, propName);
    }
  }
  return result;
}

const KNOWN_STATICS:{[name: string]:boolean} = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  arguments: true,
  arity: true
};

/**
 * Copies all own properties from a to b, with the exception of a few well
 * known properties of functions.
 * @param a source
 * @param b destination
 */
const hoistMetaData = <T>(a:{}, b:T):T => {
  // This can be improved and simplified by iterating over enumerable properties only
  // That should have the same effect
  const keys = Object.getOwnPropertyNames(a);
  for (let i = keys.length - 1; i >= 0; i--) {
    const k = keys[i];
    if (!KNOWN_STATICS[k]) {
      // @ts-ignore This is impossible to type
      b[k] = a[k];
    }
  }
  return b;
};

/**
 * For every entityConfig, process the functions in its API through a decorator
 */
export const mapApiFunctions = (
  fn:PluginDecorator,
  entityConfigs: EntityConfigs
): EntityConfigs => mapProps(entityConfigs, (entity: Entity) => ({
  ...entity,
  api: mapProps(entity.api, (apiFn: ApiFunction) => {
    const decoratedFunction = fn({ entity, fn: apiFn });
    return hoistMetaData(apiFn, decoratedFunction) as ApiFunction;
  })
}));

// EntityConfig -> Api
const toApi = (entities: EntityConfigs):{[name:string]: EntityApi} => (
  mapProps(entities, (entity: Entity) => entity.api)
);

// EntityConfig -> EntityConfig
const setEntityConfigDefaults = (ec: PartialEntity):Entity & DupConfig => {
  return {
    ttl: 300,
    invalidates: [],
    invalidatesOn: [Operation.CREATE, Operation.UPDATE, Operation.DELETE, Operation.COMMAND],
    enableDeduplication: true,
    ...ec
  };
};

// EntityConfig -> EntityConfig
const setApiConfigDefaults = (ec: PartialEntity):PartialEntity => {
  const defaults:Omit<ApiFunctionConfig, 'fnName'> & DupConfig = {
    operation: Operation.NO_OPERATION,
    invalidates: [],
    idFrom: 'ENTITY',
    byId: false,
    byIds: false,
    enableDeduplication: true
  };

  const setDefaults = (apiConfig:PartialApiFunction):ApiFunction => {
    // Do we ever need the special behavior of copyFunction?
    // We could probably just as well operate on the original function
    const copy = copyFunction(apiConfig);
    for (const k in defaults) {
      if (!copy.hasOwnProperty(k)) {
        copy[k] = defaults[k as keyof typeof defaults];
      }
    }
    return copy;
  };

  const mapApi = (api:EntityApi) => (api ? (
    mapProps(api, (apiFunction:ApiFunction, apiFnName) => {
      const apiFn = setDefaults(apiFunction);
      apiFn.fnName = apiFnName;
      return apiFn;
    })
  ) : api);

  return {
    ...ec,
    api: mapApi(ec.api)
  };
};

export const getEntityConfigs = (config: ExternalConfig):EntityConfigs => {
  const configWithNames:EntityConfigs = {};
  for (const entityName in config) {
    if (entityName !== '__config') {
      let entity = config[entityName];
      entity = setEntityConfigDefaults(entity);
      entity = setApiConfigDefaults(entity);
      entity.name = entityName;
      configWithNames[entityName] = entity as Entity;
    }
  }
  return configWithNames;
};

const getGlobalConfig = (config: ExternalConfig):Config & DupConfig => ({
  idField: 'id',
  enableDeduplication: true,
  useProductionBuild: process.NODE_ENV === 'production',
  ...(config.__config || {})
});

const applyPlugin = (
  addChangeListener: (listener: ChangeListener) => () => ChangeListener[],
  config: Config
) => (
  entityConfigs:EntityConfigs,
  plugin: Plugin
) => {
  const pluginDecorator = plugin({ addChangeListener, config, entityConfigs });
  return mapApiFunctions(pluginDecorator, entityConfigs);
};

const createPluginList = (core: Plugin, plugins:Plugin[]):Plugin[] => {
  return plugins.length
    ? [core, dedupPlugin, ...plugins, dedupPlugin]
    : [core, dedupPlugin];
};

// Config -> Api
export const build = (c:ExternalConfig, ps:Plugin[] = []) => {
  const config: Config = getGlobalConfig(c);
  const entityConfigs: EntityConfigs = getEntityConfigs(c);
  validateConfig(console, entityConfigs, config);

  const listenerStore = createListenerStore(/* config */);
  const plugins = createPluginList(cachePlugin(listenerStore.onChange), ps);

  const applyPlugin_ = applyPlugin(listenerStore.addChangeListener, config);
  return toApi(plugins.reduce(applyPlugin_, entityConfigs));
};
