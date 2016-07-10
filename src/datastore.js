// Concepts:
// Datastore - reference for datastore
// Item - a single entity, which contains all info to perform operations
import { createQuery } from './query';

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
    addTemporaryToRealId(datastore, query.value, realId);
    const item = getItem(datastore, query);
    deleteItem(datastore, query);
    addItem(datastore, { ...query, value: realId }, item);
}

function addTemporaryToRealId(datastore, tmpId, realId) {
    datastore.tempToRealId[tmpId] = realId;
}

function replaceTempIdInQuery(datastore, query) {
    if (/^tmp-/.test(query.value) && !entityExist(datastore, query)) {
        // Try to get item with id, if not exist try with id from translation table
        return datastore.tempToRealId[query.value]
                        .then(result => createQuery(query.type, result.id));
    } else {
        return Promise.resolve(query);
    }
}

function entityExist(datastore, query) {
    return !!datastore.entityCache[createKey(query)];
}

export function addItem(datastore, query, value) {
    datastore.entityCache[createKey(query)] = withTimestamp(value, Date.now());
}

export function getItem(datastore, query) {
    return replaceTempIdInQuery(datastore, query).then(translatedQuery => {
        const item = datastore.entityCache[createKey(translatedQuery)];
        const ttl = datastore.ttlMap[translatedQuery.type];

        if (item && hasExpired(item.timestamp, ttl)) {
            return withoutTimestamp(item);
        }
    });
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
        delete datastore.entityCache[createKey(translatedQuery)];
    });
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
            return getItem(datastore, createQuery(query.type, id));
        }).filter(x => x !== undefined));
    } else {
        return Promise.resolve(undefined);
    }
}

export function invalidate(datastore, type) {
    if (datastore.queryCache) {
        datastore.queryCache[type] = {};
    }
}

function safeCollectionLookup(datastore, query) {
    return (datastore.queryCache[query.type] || {})[createKey(query)];
}

function createKey(query) {
    return Object.keys(query).map(x => {
        if (typeof query[x] === 'object') {
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
