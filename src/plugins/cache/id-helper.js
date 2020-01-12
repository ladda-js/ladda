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

/**
 * Given a config, an apiFunction, its call args and an object, determine that object's id
 *
 * The id is either created by serializing the apiFnCallArgs or by using the getter (function or key)
 * set in the apiFucntion
 */
export const getId = curry((config, apiFunction, apiFnCallArgs, o) => {
  if (apiFunction && apiFunction.idFrom === 'ARGS') {
    return createIdFromArgs(apiFnCallArgs);
  }
  return getIdGetter(config, apiFunction)(o);
});

/**
 * Writes a __ladda_id__ prop into o. If o is an array, add the id to each member instead.
 *
 * Operates on copies
 * The value of the prop is determined like in getId, not sure why we're not re-using that here.
 *
 */
export const addId = curry((config, apiFunction, apiFnCallArgs, o) => {
  if (apiFunction && apiFunction.idFrom === 'ARGS') {
    return {
      ...o,
      __ladda__id: createIdFromArgs(apiFnCallArgs)
    };
  }
  const getId_ = getIdGetter(config, apiFunction);
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

/**
 * Destructively remove the __ladda_id__ from o (or each member, if o is an array)
 */
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
