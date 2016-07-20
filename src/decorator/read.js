import { createQuery } from 'query';
import {
    getItem,
    getCollection,
    addItem,
    addCollection,
} from 'datastore';

export function decorateRead(apiFn, datastore, type) {
    return (query) => {
        if (apiFn.alwaysGetFreshData === true) {
            return executeApiFnAndCache(apiFn, datastore, type, query);
        }

        const fromCache = getFromCache(apiFn, datastore, type, query);
        return fromCache.then(itemFromCache => {
            if (itemFromCache) {
                return itemFromCache;
            } else {
                return executeApiFnAndCache(apiFn, datastore, type, query);
            }
        });
    };
}

function executeApiFnAndCache(apiFn, datastore, type, query) {
    const result = apiFn(query);
    result.then(addToCache(apiFn, datastore, type, query));
    return result;
}

function getFromCache(apiFn, datastore, type, query) {
    if (shouldUseQueryCache(apiFn.plural, apiFn.byId)) {
        return getFromQueryCache(datastore, type, query, apiFn.name);
    } else {
        return getFromEntityCache(datastore, type, query);
    }
}

function shouldUseQueryCache(plural, byId) {
    return plural === true || byId === false;
}

function getFromQueryCache(datastore, type, query, apiFnName) {
    return getCollection(datastore, createQueryForCollection(type, query, apiFnName));
}

function getFromEntityCache(datastore, type, id) {
    return getItem(datastore, createQuery(type, id));
}

function addToCache(apiFn, datastore, type, query) {
    return data => {
        if (shouldUseQueryCache(apiFn.plural, apiFn.byId)) {
            addCollection(datastore, createQueryForCollection(type, query, apiFn.name), data);
        } else {
            addItem(datastore, createQuery(type, query), data);
        }
    };
}

function createQueryForCollection(type, query, apiFnName) {
    return createQuery(type, query, { name: apiFnName });
}
