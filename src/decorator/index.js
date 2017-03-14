import {compose, values} from '../fp';
import {createEntityStore} from '../entity-store';
import {createQueryCache} from '../query-cache';
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

export const decoratorPlugin = ({ config, entityConfigs }) => {
  const entityStore = compose(createEntityStore, values)(entityConfigs);
  const queryCache = createQueryCache(entityStore);
  return ({ entity, apiFn }) => {
    const handler = HANDLERS[apiFn.operation];
    return handler(config, entityStore, queryCache, entity, apiFn);
  };
};

