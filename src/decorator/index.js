import {curry, mapValues} from 'fp';
import {decorateCreate} from './create';
import {decorateRead} from './read';
import {decorateUpdate} from './update';
import {decorateDelete} from './delete';

const decorateApi = curry((entityStore, queryCache, entity, apiFn) => {
    if (!apiFn.operation) {
        return apiFn;
    }

    const handler = {
        CREATE: decorateCreate,
        READ: decorateRead,
        UPDATE: decorateUpdate,
        DELETE: decorateDelete
    }[apiFn.operation];
    return handler(entityStore, queryCache, entity, apiFn);
});

export const decorate = curry((entityStore, queryCache, entity) => {
    const decoratedApi = mapValues(decorateApi(entityStore, queryCache, entity), entity.api);
    return {
        ...entity,
        api: decoratedApi
    };
});
