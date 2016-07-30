// Concepts: AbstractEntity
import { decorateCreate } from './create';
import { decorateRead } from './read';
import { decorateUpdate } from './update';
import { decorateDelete } from './delete';

export function decorateApi(datastore) {
    return abstractEntity => {
        const api = getApi(abstractEntity);
        const decoratedApi = decorateEveryApiFn(api, abstractEntity, datastore);
        addDecoratedApi(abstractEntity, decoratedApi);
    };
}

function getApi(abstractEntity) {
    return abstractEntity.val.api;
}

function decorateEveryApiFn(api, abstractEntity, datastore) {
    return Object.keys(api)
                 .map((name) => ({
                     name,
                     val: decorateApiFn(abstractEntity, api[name], datastore)
                 }));
}

function addDecoratedApi(abstractEntity, decoratedApi) {
    abstractEntity.val.decoratedApi = decoratedApi;
}

function decorateApiFn(abstractEntity, apiFn, datastore) {
    apiFn.invalidates = apiFn.invalidates || [];

    switch (apiFn.operation) {
        case 'CREATE':
            return decorateCreate(apiFn, datastore, abstractEntity);
        case 'READ':
            return decorateRead(apiFn, datastore, abstractEntity);
        case 'UPDATE':
            return decorateUpdate(apiFn, datastore, abstractEntity);
        case 'DELETE':
            return decorateDelete(apiFn, datastore, abstractEntity);
    }
}
