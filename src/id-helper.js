import {curry, map, prop} from 'ladda-fp';
import {serialize} from './serializer';

const getIdGetter = (c, aFn) => {
  if (aFn && aFn.idFrom && typeof aFn.idFrom === 'function') {
    return aFn.idFrom;
  }
  return prop(c.idField || 'id');
};

export const addId = curry((c, aFn, args, o) => {
  if (aFn && aFn.idFrom === 'ARGS') {
    return {
      ...o,
      __ladda__id: serialize(args)
    };
  }
  const getId = getIdGetter(c, aFn);
  if (Array.isArray(o)) {
    return map(x => ({
      ...x,
      __ladda__id: getId(x)
    }), o);
  }
  return {
    ...o,
    __ladda__id: getId(o)
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
