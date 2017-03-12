import {curry, mapValues} from '../fp';
import {decorateCreate} from './create';
import {decorateRead} from './read';
import {decorateUpdate} from './update';
import {decorateDelete} from './delete';
import {decorateNoOperation} from './no-operation';

export const decorateApi = curry((config, entityStore, queryCache, entity, apiFn) => {
  const handler = {
    CREATE: decorateCreate,
    READ: decorateRead,
    UPDATE: decorateUpdate,
    DELETE: decorateDelete,
    NO_OPERATION: decorateNoOperation
  }[apiFn.operation];
  return handler(config, entityStore, queryCache, entity, apiFn);
});

export const decorate = curry((config, entityStore, queryCache, entity) => {
  const decoratedApi = mapValues(
    decorateApi(config, entityStore, queryCache, entity),
    entity.api
  );
  return {
    ...entity,
    api: decoratedApi
  };
});

export const decorate2 = curry(
  (entityStore, queryCache, config, entityConfigs, entity, apiFnName, apiFn) => {
    const handler = {
      CREATE: decorateCreate,
      READ: decorateRead,
      UPDATE: decorateUpdate,
      DELETE: decorateDelete,
      NO_OPERATION: decorateNoOperation
    }[apiFn.operation];
    return handler(config, entityStore, queryCache, entity, apiFn);
  }
);

