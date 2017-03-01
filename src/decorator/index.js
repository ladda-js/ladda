import {curry, mapValues} from 'fp';
import {decorateCreate} from './create';
import {decorateRead} from './read';
import {decorateUpdate} from './update';
import {decorateDelete} from './delete';
import {decorateNoOperation} from './no-operation';

const decorateApi = curry((entityStore, queryCache, entity, apiFn) => {
    const handler = {
        CREATE: decorateCreate,
        READ: decorateRead,
        UPDATE: decorateUpdate,
        DELETE: decorateDelete,
        NO_OPERATION: decorateNoOperation
    }[apiFn.operation || 'NO_OPERATION'];
    return handler(entityStore, queryCache, entity, apiFn);
});

export const decorate = curry((entityStore, queryCache, entity) => {
    const decoratedApi = mapValues(decorateApi(entityStore, queryCache, entity), entity.api);
    return {
        ...entity,
        api: decoratedApi
    };
});
