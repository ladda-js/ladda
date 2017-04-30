import {curry, values} from 'ladda-fp';
import {createCache} from './cache';
import {decorateCreate} from './operations/create';
import {decorateRead} from './operations/read';
import {decorateUpdate} from './operations/update';
import {decorateDelete} from './operations/delete';
import {decorateNoOperation} from './operations/no-operation';

const HANDLERS = {
  CREATE: decorateCreate,
  READ: decorateRead,
  UPDATE: decorateUpdate,
  DELETE: decorateDelete,
  NO_OPERATION: decorateNoOperation
};

const notify = curry((onChange, entity, fn, changeType, args, payload) => {
  onChange({
    type: changeType,
    entity: entity.name,
    apiFn: fn.name,
    values: Array.isArray(payload) ? payload : [payload],
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
