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

import {merge} from './merger';
import {curry, reduce, map_, clone, noop} from './fp';
import {removeId} from './id-helper';

// Value -> StoreValue
const toStoreValue = v => ({value: v, timestamp: Date.now()});

// EntityStore -> String -> Value
const read = ([_, s], k) => (s[k] ? {...s[k], value: clone(s[k].value)} : s[k]);

// EntityStore -> String -> Value -> ()
const set = ([eMap, s], k, v) => { s[k] = toStoreValue(clone(v)); };

// EntityStore -> String -> ()
const rm = curry(([_, s], k) => delete s[k]);

// Entity -> String
const getEntityType = e => e.viewOf || e.name;

// EntityStore -> Entity -> ()
const rmViews = ([eMap, s], e) => {
  const entityType = getEntityType(e);
  const toRemove = [...eMap[entityType]];
  map_(rm([eMap, s]), toRemove);
};

// Entity -> Value -> String
const createEntityKey = (e, v) => {
  return getEntityType(e) + v.__ladda__id;
};

// Entity -> Value -> String
const createViewKey = (e, v) => {
  return e.name + v.__ladda__id;
};

// Entity -> Bool
const isView = e => !!e.viewOf;

// EntityStore -> Hook
const getHook = (es) => es[2];

// TODO All hook code needs to be able to deal with views also!
// EntityStore -> Type -> [Entity] -> ()
const triggerHook = curry((es, e, type, xs) => getHook(es)({
  type,
  entity: getEntityType(e),
  entities: removeId(xs)
}));

// Function -> Function -> EntityStore -> Entity -> Value -> a
const handle = curry((viewHandler, entityHandler, s, e, v) => {
  if (isView(e)) {
    return viewHandler(s, e, v);
  }
  return entityHandler(s, e, v);
});

// EntityStore -> Entity -> Value -> Bool
const entityValueExist = (s, e, v) => !!read(s, createEntityKey(e, v));

// EntityStore -> Entity -> Value -> ()
const setEntityValue = (s, e, v) => {
  if (!v.__ladda__id) {
    throw new Error(`Value is missing id, tried to add to entity ${e.name}`);
  }
  const k = createEntityKey(e, v);
  set(s, k, v);
  return v;
};

// EntityStore -> Entity -> Value -> ()
const setViewValue = (s, e, v) => {
  if (!v.__ladda__id) {
    throw new Error(`Value is missing id, tried to add to view ${e.name}`);
  }

  if (entityValueExist(s, e, v)) {
    const eValue = read(s, createEntityKey(e, v)).value;
    setEntityValue(s, e, merge(v, eValue));
    rmViews(s, e); // all views will prefer entity cache since it is newer
  } else {
    const k = createViewKey(e, v);
    set(s, k, v);
  }

  return v;
};

// EntityStore -> Entity -> [Value] -> ()
export const mPut = curry((es, e, xs) => {
  map_(handle(setViewValue, setEntityValue)(es, e))(xs);
  triggerHook(es, e, 'UPDATE', xs);
});

// EntityStore -> Entity -> Value -> ()
export const put = curry((es, e, x) => mPut(es, e, [x]));

// EntityStore -> Entity -> String -> Value
const getEntityValue = (s, e, id) => {
  const k = createEntityKey(e, {__ladda__id: id});
  return read(s, k);
};

// EntityStore -> Entity -> String -> Value
const getViewValue = (s, e, id) => {
  const entityValue = read(s, createEntityKey(e, {__ladda__id: id}));
  const viewValue = read(s, createViewKey(e, {__ladda__id: id}));
  const onlyViewValueExist = viewValue && !entityValue;

  if (onlyViewValueExist) {
    return viewValue;
  }
  return entityValue;
};

// EntityStore -> Entity -> String -> ()
export const get = handle(getViewValue, getEntityValue);

// EntityStore -> Entity -> String -> ()
export const remove = (es, e, id) => {
  const x = get(es, e, id);
  rm(es, createEntityKey(e, {__ladda__id: id}));
  rmViews(es, e);
  if (x) {
    triggerHook(es, e, 'DELETE', [x.value]);
  }
};

// EntityStore -> Entity -> String -> Bool
export const contains = (es, e, id) => !!handle(getViewValue, getEntityValue)(es, e, id);

// EntityStore -> Entity -> EntityStore
const registerView = ([eMap, ...other], e) => {
  if (!eMap[e.viewOf]) {
    eMap[e.viewOf] = [];
  }
  eMap[e.viewOf].push(e.name);
  return [eMap, ...other];
};

// EntityStore -> Entity -> EntityStore
const registerEntity = ([eMap, ...other], e) => {
  if (!eMap[e.name]) {
    eMap[e.name] = [];
  }
  return [eMap, ...other];
};

// EntityStore -> Entity -> EntityStore
const updateIndex = (m, e) => { return isView(e) ? registerView(m, e) : registerEntity(m, e); };

// [Entity] -> EntityStore
export const createEntityStore = (c, hook = noop) => reduce(updateIndex, [{}, {}, hook], c);
