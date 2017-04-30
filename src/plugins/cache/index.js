import {values} from 'ladda-fp';
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
  NO_OPERATION: decorateNoOperation,
  NOTIFIER: decorateNoOperation
};

const getHandler = (fn) => {
  if (fn.isNotifier === true) {
    return HANDLERS.NOTIFIER;
  }

  return HANDLERS[fn.operation];
};

export const cachePlugin = (onChange) => ({ config, entityConfigs }) => {
  const cache = createCache(values(entityConfigs), onChange);
  return ({ entity, fn }) => {
    const handler = getHandler(fn);
    return handler(config, cache, entity, fn);
  };
};
