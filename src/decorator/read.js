import { createQuery } from 'query';
import { invalidateEntity, invalidateFunction } from 'invalidator';
import {
    getItem,
    getCollection,
    addItem,
    addCollection,
} from 'datastore';

export function decorateRead(apiFn, datastore, abstractEntity) {
    return (query) => {
        if (apiFn.alwaysGetFreshData === true) {
            return executeApiFnAndCache(apiFn, datastore, abstractEntity, query);
        }

        const fromCache = getFromCache(apiFn, datastore, abstractEntity.name, query);
        return fromCache.then(itemFromCache => {
            if (itemFromCache) {
                return itemFromCache;
            } else {
                return executeApiFnAndCache(apiFn, datastore, abstractEntity, query);
            }
        });
    };
}

function executeApiFnAndCache(apiFn, datastore, abstractEntity, query) {
    const result = apiFn(query);
    result.then(addToCache(apiFn, datastore, abstractEntity, query));
    return result;
}

function getFromCache(apiFn, datastore, type, query) {
    if (apiFn.plural) {
        return getFromQueryCache(datastore, type, query, apiFn.name);
    } else {
        return getFromEntityCache(datastore, type, query);
    }
}

function getFromQueryCache(datastore, type, query, apiFnName) {
    return getCollection(datastore, createQueryForCollection(type, query, apiFnName));
}

function getFromEntityCache(datastore, type, id) {
    return getItem(datastore, createQuery(type, id));
}

function addToCache(apiFn, datastore, abstractEntity, query) {
    return data => {
        if (apiFn.plural) {
            const collectionQuery = createQueryForCollection(abstractEntity.name,
                                                             query,
                                                             apiFn.name);
            addCollection(datastore,
                          collectionQuery,
                          data);
        } else {
            addItem(datastore, createQuery(abstractEntity.name, query), data);
        }

        invalidateEntity(datastore, abstractEntity, 'READ');
        invalidateFunction(datastore, abstractEntity, apiFn);
    };
}

function createQueryForCollection(type, query, apiFnName) {
    return createQuery(type, query, { name: apiFnName });
}
