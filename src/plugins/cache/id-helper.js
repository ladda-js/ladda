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

export const addId = curry((c, aFn, args, o) => {
  if (aFn && aFn.idFrom === 'ARGS') {
    return {
      ...o,
      __ladda__id: createIdFromArgs(args)
    };
  }
  const getId_ = getIdGetter(c, aFn);
  if (Array.isArray(o)) {
    return map(x => ({
      ...x,
      __ladda__id: getId_(x)
    }), o);
  }
  return {
    ...o,
    __ladda__id: getId_(o)
  };
});

export const removeId = (o) => {
  if (!o) {
    return o;
  }

  if (Array.isArray(o)) {
    return map(x => {
      delete x.__ladda__id;
      return x;
    }, o);
  }
  delete o.__ladda__id;
  return o;
};
