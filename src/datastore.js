// Concepts:
// Datastore - reference for datastore
// Item - a single entity, which contains all info to perform operations
import { createQuery } from './query';
import { merge } from './merger';

export function createDatastore(ttlMap) {
    return {
        queryCache: {},
        entityCache: {},
        incrementingId: 1,
        ttlMap,
        tempToRealId: {}
    };
}

export function createItem(datastore, query, value, promise) {
    const id = 'tmp-' + datastore.incrementingId++;
    query.value = id;
    addItem(datastore, query, value);
    addTemporaryToRealId(datastore, id, promise);
    return id;
}

export function replaceTempId(datastore, query, realId) {
    const item = getItemSync(datastore, query);
    deleteItemSync(datastore, query);
    addItem(datastore, { ...query, value: realId }, item);
}

function addTemporaryToRealId(datastore, tmpId, realId) {
    datastore.tempToRealId[tmpId] = realId;
}

function replaceTempIdInQuery(datastore, query) {
    if (isQueryForTempId(query) && !entityExist(datastore, query)) {
        // Try to get item with id, if not exist try with id from translation table
        return datastore.tempToRealId[query.value]
                        .then(newId => createQuery(query.type, newId));
    } else {
        return Promise.resolve(query);
    }
}

function isQueryForTempId(query) {
    return /^tmp-/.test(query.value);
}

function entityExist(datastore, query) {
    return !!datastore.entityCache[createKey(query)];
}

export function addItem(datastore, query, value) {
    datastore.entityCache[createKey(query)] = withTimestamp(value, Date.now());
}

export function getItem(datastore, query) {
    return replaceTempIdInQuery(datastore, query).then(translatedQuery => {
        return getItemSync(datastore, translatedQuery);
    });
}

function getItemSync(datastore, query) {
    var item = datastore.entityCache[createKey(query)];
    var ttl = datastore.ttlMap[query.type];

    if (item && (isQueryForTempId(query) || hasExpired(item.timestamp, ttl))) {
        return withoutTimestamp(item);
    }
}

function hasExpired(timestamp, ttl) {
    return (Date.now() - timestamp) / 1000 < ttl;
}

export function updateItem(datastore, query, value) {
    return replaceTempIdInQuery(datastore, query).then(translatedQuery => {
        return datastore.entityCache[createKey(translatedQuery)] = withTimestamp(value, Date.now());
    });
}

export function deleteItem(datastore, query) {
    return replaceTempIdInQuery(datastore, query).then(translatedQuery => {
        deleteItemSync(datastore, translatedQuery);
    });
}

function deleteItemSync(datastore, query) {
    delete datastore.entityCache[createKey(query)];
}

export function addCollection(datastore, query, value) {
    const ids = value.map(x => x.id);
    value.forEach(x => {
        const queryForItem = createQuery(query.type, x.id);
        addItem(datastore, queryForItem, x);
    });

    if (!datastore.queryCache[query.type]) {
        datastore.queryCache[query.type] = {};
    }

    return datastore.queryCache[query.type][createKey(query)] = withTimestamp(ids, Date.now());
}

export function getCollection(datastore, query) {
    const collection = safeCollectionLookup(datastore, query);
    const ttl = datastore.ttlMap[query.type];

    if (collection && hasExpired(collection.timestamp, ttl)) {
        return Promise.all(withoutTimestamp(collection).map(id => {
            return getItemSync(datastore, createQuery(query.type, id));
        }).filter(x => x !== undefined));
    } else {
        return Promise.resolve(undefined);
    }
}

export function invalidate(datastore, type, method) {
    if (datastore.queryCache) {
        if (method) {
            invalidateQueryCacheByFunction(datastore, type, method);
        } else {
            if (type.indexOf('(*)') !== -1) {
                var allMatcher = getAllMatcher(type.substring(0, type.length - 3));
                var candidates = Object.keys(datastore.entityCache || {});
                var toInvalidate = candidates.filter(function (x) {
                    return allMatcher.test(x);
                });
                toInvalidate.forEach(function (key) {
                    delete datastore.entityCache[key];
                });
                datastore.queryCache[type.substring(0, type.length - 3)] = {};
            }
            datastore.queryCache[type] = {};
        }
    }
}

function getAllMatcher(type) {
    return new RegExp('^' + type + '.*$');
}

function invalidateQueryCacheByFunction(datastore, type, method) {
    const matcher = getMatcher(type, method);
    const candidates = Object.keys(datastore.queryCache[type] || {});
    const toInvalidate = candidates.filter((x) => matcher.test(x));
    toInvalidate.forEach(key => {
        delete datastore.queryCache[type][key];
    });
}

function getMatcher(type, method) {
    if (method.slice(method.length - 3, method.length) === '(*)') {
        const cleanMethod = method.slice(0, method.length - 3);
        return new RegExp('^' + type + '-' + cleanMethod + '-.*$');
    } else {
        return new RegExp('^' + type + '-' + method + '-$');
    }
}

export function patchItem(datastore, query, item) {
    getItem(datastore, query).then(superItem => {
        if (superItem) {
            updateItem(datastore, query, merge(item, superItem));
        }
    });
}

function safeCollectionLookup(datastore, query) {
    return (datastore.queryCache[query.type] || {})[createKey(query)];
}

function createKey(query) {
    return Object.keys(query).map(x => {
        if (query[x] && typeof query[x] === 'object') {
            return createKey(query[x]);
        } else {
            return query[x];
        }
    }).join('-');
}

function withTimestamp(value, timestamp) {
    return {
        timestamp,
        value
    };
}

function withoutTimestamp(valueWithTimestamp) {
    return valueWithTimestamp.value;
}
