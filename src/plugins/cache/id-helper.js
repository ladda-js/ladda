import {curry, map, prop} from 'ladda-fp';
import {serialize} from './serializer';

export const EMPTY_ARGS_PLACEHOLDER = '__EMPTY_ARGS__';

const createIdFromArgs = (args) => serialize(args) || EMPTY_ARGS_PLACEHOLDER;

const getIdGetter = (c, aFn) => {
  if (aFn && aFn.idFrom && typeof aFn.idFrom === 'function') {
    return aFn.idFrom;
  }
  return prop(c.idField || 'id');
};

export const getId = curry((c, aFn, args, o) => {
  if (aFn && aFn.idFrom === 'ARGS') {
    return createIdFromArgs(args);
  }
  return getIdGetter(c, aFn)(o);
});

export const withId = (id, item) => ({ __ladda__id: id, item });
export const withoutId = (itemWithId) => itemWithId.item;

export const addId = curry((c, aFn, args, o) => {
  if (aFn && aFn.idFrom === 'ARGS') {
    return withId(createIdFromArgs(args), o);
  }
  const getId_ = getIdGetter(c, aFn);
  if (Array.isArray(o)) {
    return map(x => withId(getId_(x), x), o);
  }
  return withId(getId_(o), o);
});

export const removeId = (o) => {
  if (!o) {
    return o;
  }

  if (Array.isArray(o)) {
    return map(withoutId, o);
  }
  return withoutId(o);
};
