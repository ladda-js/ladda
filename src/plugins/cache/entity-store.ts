/* A data structure that is aware of views and entities.
 * 1. If a value exist both in a view and entity, the newest value is preferred.
 * 2. If a view or entity is removed, the connected views and entities are also removed.
 * 3. If a new view value is added, it will be merged into the entity value if such exist.
 * otherwise a new view value will be added.
 *
 * Note that a view will always return at least what constitutes the view.
 * It can return the full entity too. This means the client code needs to take this into account
 * by not depending on only a certain set of values being there.
 * This is done to save memory and to simplify data synchronization.
 * Of course, this also requiers the view to truly be a subset of the entity.
 */

import {curry, clone} from 'ladda-fp';
import {merge} from './merger';
import {removeId} from './id-helper';
import {
  CacheValue, View, Entity, Value
} from '../../types';

/** Maps entityNames to the views depending on them */
type EntityMap = {
  [entityName: string]: string[]
};

type ValueStore = {
  [key:string]: CacheValue<any>
};

export type EntityStore = [
  EntityMap,
  ValueStore
];

export type EntityConfig = View | Entity;

/**
 * Wraps a value in an object containing the `value` and a timestamp
 */
const toStoreValue = <T>(v: T):CacheValue<T> => ({value: v, timestamp: Date.now()});

// EntityStore -> String -> Value
const read = <T>([_, s]:EntityStore, k:string):CacheValue<T>|undefined => (
  s[k] ? {...s[k], value: clone(s[k].value)} : s[k]
);

// EntityStore -> String -> Value -> ()
const set = ([_, s]:EntityStore, k:string, v:Value) => { s[k] = toStoreValue(clone(v)); };

// EntityStore -> String -> ()
const rm = ([_, s]:EntityStore, k:string) => delete s[k];

// Entity -> String
const getEntityType = (entityConfig: EntityConfig):string => (
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  isView(entityConfig) ? entityConfig.viewOf : entityConfig.name
);

// EntityStore -> Entity -> ()
const rmViews = ([eMap, s]:EntityStore, e:EntityConfig) => {
  const entityType = getEntityType(e);
  const toRemove = [...eMap[entityType]];
  toRemove.forEach(viewName => rm([eMap, s], viewName));
};

// Entity -> Value -> String
const createEntityKey = (entityConfig:EntityConfig, v:Value):string => {
  return getEntityType(entityConfig) + v.__ladda__id;
};

// Entity -> Value -> String
const createViewKey = (entityConfig:EntityConfig, v:Value) => {
  return entityConfig.name + v.__ladda__id;
};

// Entity -> Bool
const isView = (e:EntityConfig):e is View => !!(e as any).viewOf;

/**
 * Depending on whether e is a view or an entity, applies either the viewHandler or the entityHandler
 */
const handle:{
  <T, R>(
    viewHandler:(s:EntityStore, e:View, value:T) => R,
    entityHandler:(s:EntityStore, e:Entity, value:T) => R,
    entityStore: EntityStore,
    entityConfig:EntityConfig,
    value: T
  ):R
  <T, R>(
    viewHandler:(s:EntityStore, e:View, value:T) => R,
    entityHandler:(s:EntityStore, e:Entity, value:T) => R):{
    (
      entityStore: EntityStore,
      entityConfig:EntityConfig,
      value: T
    ):R
    (
      entityStore: EntityStore,
      entityConfig:EntityConfig
    ):(value: T) => R
  }
} = curry(<T, R>(
  viewHandler:(s:EntityStore, e:View, value:T) => R,
  entityHandler:(s:EntityStore, e:Entity, value:T) => R,
  entityStore: EntityStore,
  entityConfig:EntityConfig,
  value: T):R => {
  if (isView(entityConfig)) {
    return viewHandler(entityStore, entityConfig, value);
  }
  return entityHandler(entityStore, entityConfig, value);
});

// EntityStore -> Entity -> Value -> Bool
const entityValueExist = (s:EntityStore, e:Entity, v:Value) => !!read(s, createEntityKey(e, v));

// EntityStore -> Entity -> Value -> ()
const setEntityValue = (entityStore:EntityStore, e:Entity, v:Value) => {
  if (!v.__ladda__id) {
    throw new Error(`Value is missing id, tried to add to entity ${e.name}`);
  }
  const k = createEntityKey(e, v);
  set(entityStore, k, v);
  return v;
};

// EntityStore -> Entity -> Value -> ()
const setViewValue = (entityStore:EntityStore, e:View, v:Value) => {
  if (!v.__ladda__id) {
    throw new Error(`Value is missing id, tried to add to view ${e.name}`);
  }

  if (entityValueExist(entityStore, e, v)) {
    const eValue = read(entityStore, createEntityKey(e, v))!.value;
    setEntityValue(entityStore, e, merge(v, eValue));
    rmViews(entityStore, e); // all views will prefer entity cache since it is newer
  } else {
    const k = createViewKey(e, v);
    set(entityStore, k, v);
  }

  return v;
};

// EntityStore -> Entity -> [Value] -> ()
export const mPut:{
  (es:EntityStore, e:EntityConfig, xs:Value[]): void
  (es:EntityStore, e:EntityConfig): (xs:Value[]) => void
  (es:EntityStore): (e:EntityConfig, xs:Value[]) => void
} = curry((es:EntityStore, e:EntityConfig, xs:Value[]) => {
  xs.forEach(x => handle(setViewValue, setEntityValue)(es, e, x));
});

// EntityStore -> Entity -> Value -> ()
export const put:{
  (es:EntityStore, e:EntityConfig, x:Value): void
  (es:EntityStore, e:EntityConfig): (x:Value) => void
  (es:EntityStore): (e:EntityConfig, x:Value) => void
} = curry((es:EntityStore, e:EntityConfig, x:Value) => mPut(es, e, [x]));

// EntityStore -> Entity -> String -> Value
const getEntityValue = <T>(entityStore:EntityStore, entityConfig:EntityConfig, id:string) => {
  const k = createEntityKey(entityConfig, {__ladda__id: id});
  return read<T>(entityStore, k);
};

// EntityStore -> Entity -> String -> Value
const getViewValue = <T>(entityStore:EntityStore, view:View, id:string) => {
  const entityValue = read<T>(entityStore, createEntityKey(view, {__ladda__id: id}));
  const viewValue = read<T>(entityStore, createViewKey(view, {__ladda__id: id}));
  const onlyViewValueExist = viewValue && !entityValue;

  if (onlyViewValueExist) {
    return viewValue;
  }
  return entityValue;
};

// EntityStore -> Entity -> String -> ()
export const get:{
  <T>(es: EntityStore, e:EntityConfig, id:string):CacheValue<T>|undefined
  <T>(es: EntityStore, e:EntityConfig): (id:string) => CacheValue<T>|undefined
} = handle(getViewValue, getEntityValue);

// EntityStore -> Entity -> String -> Value
export const remove = <T>(es:EntityStore, e:EntityConfig, id:string) => {
  const x = get<T>(es, e, id);
  rm(es, createEntityKey(e, {__ladda__id: id}));
  rmViews(es, e);
  if (x) {
    return removeId(x.value);
  }
  return undefined;
};

// EntityStore -> Entity -> String -> Bool
export const contains = (
  es:EntityStore,
  e: EntityConfig,
  id:string
) => !!handle<string, {}|undefined>(getViewValue, getEntityValue)(es, e, id);

// EntityStore -> Entity -> EntityStore
const registerView = ([eMap, store]:EntityStore, entity:View):EntityStore => {
  if (!eMap[entity.viewOf]) {
    eMap[entity.viewOf] = [];
  }
  eMap[entity.viewOf].push(entity.name);
  return [eMap, store];
};

// EntityStore -> Entity -> EntityStore
const registerEntity = ([eMap, store]: EntityStore, entityConfig: Entity):EntityStore => {
  if (!eMap[entityConfig.name]) {
    eMap[entityConfig.name] = [];
  }
  return [eMap, store];
};

// EntityStore -> Entity -> EntityStore
const updateIndex = (m: EntityStore, entity:EntityConfig):EntityStore => {
  return isView(entity) ? registerView(m, entity) : registerEntity(m, entity);
};

// [Entity] -> EntityStore
export const createEntityStore = (configs: EntityConfig[]):EntityStore => configs.reduce(
  updateIndex, [{}, {}]
);
