import {serialize} from './serializer';
import { ApiFunctionConfig, Config, Value } from '../../types';

export const EMPTY_ARGS_PLACEHOLDER = '__EMPTY_ARGS__';

const createIdFromArgs = (args: any):string => String(serialize(args)) || EMPTY_ARGS_PLACEHOLDER;

const getIdGetter = (c:Config, aFn?:ApiFunctionConfig):(x:any) => string => {
  if (aFn && aFn.idFrom && typeof aFn.idFrom === 'function') {
    return aFn.idFrom;
  }
  return (x:any):string => x[c.idField || 'id'];
};

/**
 * Given a config, an apiFunction, its call args and an object, determine that object's id
 *
 * The id is either created by serializing the apiFnCallArgs or by using the getter (function or key)
 * set in the apiFucntion
 */
export const getId = (
  config: Config,
  apiFunction: ApiFunctionConfig,
  apiFnCallArgs: any[],
  o: any
) => {
  if (apiFunction && apiFunction.idFrom === 'ARGS') {
    return createIdFromArgs(apiFnCallArgs);
  }
  return getIdGetter(config, apiFunction)(o);
};

/**
 * Writes a __ladda_id__ prop into o. If o is an array, add the id to each member instead.
 *
 * Operates on copies
 * The value of the prop is determined like in getId, not sure why we're not re-using that here.
 *
 */
export const addId:{
  <T extends {}>(
    config: Config,
    apiFunction: ApiFunctionConfig | undefined,
    apiFnCallArgs: any,
    o: T[]
  ):(T & Value)[]
  <T extends {}>(
    config: Config,
    apiFunction: ApiFunctionConfig | undefined,
    apiFnCallArgs: any,
    o: T
  ):T & Value
} = <T extends {}>(
  config: Config,
  apiFunction: ApiFunctionConfig | undefined,
  apiFnCallArgs: any,
  o: T | T[]
) => {
  if (apiFunction && apiFunction.idFrom === 'ARGS') {
    // @ts-ignore Problem? Might be we treat an array like an object here
    return {
      ...o,
      __ladda__id: createIdFromArgs(apiFnCallArgs)
    };
  }
  const getId_ = getIdGetter(config, apiFunction);
  if (Array.isArray(o)) {
    // @ts-ignore Variance issue that won't be a problem in practice because x is readonly
    return o.map(x => ({
      ...x,
      __ladda__id: getId_(x)
    }));
  }
  return {
    ...o,
    __ladda__id: getId_(o)
  };
};

/**
 * Destructively remove the __ladda_id__ from o (or each member, if o is an array)
 */
export const removeId:{
  <T extends void|null|undefined|''|0|false>(o:T):T
  <T extends {}>(o:T[]):(T & {__ladda__id: void})[]
  <T extends {}>(o:T):T & {__ladda__id: void}
} = (o:any) => {
  if (!o) {
    return o;
  }

  if (Array.isArray(o)) {
    return o.map((x: any) => {
      delete x.__ladda__id;
      return x;
    });
  }
  delete o.__ladda__id;
  return o;
};
