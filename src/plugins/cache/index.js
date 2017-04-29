import {compose, values} from 'ladda-fp';
import {createEntityStore} from './entity-store';
import {createQueryCache} from './query-cache';
import {decorateCreate} from './create';
import {decorateRead} from './read';
import {decorateUpdate} from './update';
import {decorateDelete} from './delete';
import {decorateNoOperation} from './no-operation';

const HANDLERS = {
  CREATE: decorateCreate,
  READ: decorateRead,
  UPDATE: decorateUpdate,
  DELETE: decorateDelete,
  NO_OPERATION: decorateNoOperation
};

export const cachePlugin = (onChange) => ({ config, entityConfigs }) => {
  const entityStore = compose((c) => createEntityStore(c, onChange), values)(entityConfigs);
  const queryCache = createQueryCache(entityStore, onChange);
  return ({ entity, fn }) => {
    const handler = HANDLERS[fn.operation];
    return handler(config, entityStore, queryCache, entity, fn);
  };
};
