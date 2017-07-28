import {curry, values} from 'ladda-fp';
import {createCache} from './cache';
import {decorateCreate} from './operations/create';
import {decorateRead} from './operations/read';
import {decorateUpdate} from './operations/update';
import {decorateDelete} from './operations/delete';
import {decorateCommand} from './operations/command';
import {decorateNoOperation} from './operations/no-operation';

const HANDLERS = {
  CREATE: decorateCreate,
  READ: decorateRead,
  UPDATE: decorateUpdate,
  DELETE: decorateDelete,
  COMMAND: decorateCommand,
  NO_OPERATION: decorateNoOperation
};

const normalizePayload = payload => {
  if (payload === null) {
    return payload;
  }
  return Array.isArray(payload) ? payload : [payload];
};

const notify = curry((onChange, entity, fn, args, payload) => {
  onChange({
    operation: fn.operation,
    entity: entity.name,
    apiFn: fn.fnName,
    values: normalizePayload(payload),
    args
  });
});

export const cachePlugin = (onChange) => ({ config, entityConfigs }) => {
  const cache = createCache(values(entityConfigs));
  return ({ entity, fn }) => {
    const handler = HANDLERS[fn.operation];
    const notify_ = notify(onChange, entity, fn);
    return handler(config, cache, notify_, entity, fn);
  };
};
