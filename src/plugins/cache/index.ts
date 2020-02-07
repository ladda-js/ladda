import {
  ApiFunction, ApiFunctionConfig, Config, Entity, Operation, Plugin, PluginDecorator, PluginParams
} from '../../types';
import { Cache, createCache } from './cache';
import { decorateCommand } from './operations/command';
import { decorateCreate } from './operations/create';
import { decorateDelete } from './operations/delete';
import { decorateNoOperation } from './operations/no-operation';
import { decorateRead } from './operations/read';
import { decorateUpdate } from './operations/update';

interface Decorator<R, A extends any[]> {
  (
    config: Config,
    cache: Cache,
    notify: (args: A, result: R)=> void,
    e: Entity,
    aFn: ApiFunction<R, A>
  ):ApiFunction
}

const HANDLERS:{[operation in Operation]: Decorator<any, any>} = {
  CREATE: decorateCreate,
  READ: decorateRead,
  UPDATE: decorateUpdate,
  DELETE: decorateDelete,
  COMMAND: decorateCommand,
  NO_OPERATION: decorateNoOperation
};

const normalizePayload:{
  (payload: null):null
  <T>(payload: T[]):T[]
  <T>(payload: T):T[]
} = (payload:any) => {
  if (payload === null) {
    return payload;
  }
  return Array.isArray(payload) ? payload : [payload];
};

export interface Change {
  operation: Operation,
  entity: string,
  apiFn: string,
  values: any[],
  args: any[]
}

export interface ChangeHandler {
  (change: Change):void
}

const notify = <R, A extends any[]>(
  onChange: ChangeHandler,
  entity: Entity,
  fn: ApiFunctionConfig
) => (
    args: A,
    payload: R
  ) => {
    onChange({
      operation: fn.operation!, // We know that at this point the operation has been filled with defaults
      entity: entity.name,
      apiFn: fn.fnName!, // We know that at this point the operation has been filled with defaults
      values: normalizePayload(payload),
      args
    });
  };

export const cachePlugin = (
  onChange:ChangeHandler
):Plugin => (
  { config, entityConfigs }:PluginParams
):PluginDecorator => {
  const cache = createCache(Object.values(entityConfigs));
  // @ts-ignore Variance issue that won't be a problem in practice
  return ({ entity, fn }) => {
    const handler = HANDLERS[fn.operation!];
    const notify_ = notify(onChange, entity, fn);
    return handler(config, cache, notify_, entity, fn);
  };
};
