export default function Caching(config) {
    const storage = {
        dummyItem: {
            timestamp: 1212
        }
    };
    const collectionQueries = {
        dummyItem: {
            timestamp: 1212
        }
    };
    const temporaryIds = {

    };

    return {
        preRead,
        postRead,
        preWrite,
        postWrite,
        postDelete,
        preDelete
    };

    function preRead(next, apiName, methodName, methodMeta, args) {
        const typeConfig = getTypeConfig(apiName, methodMeta.entity);
        const key = createKey(apiName, methodName, methodMeta.multipleEntities, args, methodMeta.entity);

        let fromCache;
        if (typeConfig && (fromCache = getFromCache(typeConfig, key))) {
            return new Promise(
                resolve => resolve(fromCache)
            );
        } else {
            return next(args);
        }
    }

    function postRead(apiName, methodName, methodMeta, args, promise) {
        const type = methodMeta.entity;

        promise.then((result) => {
            saveToCache(createKey(apiName, methodName, methodMeta.multipleEntities, args, type),
                        { data: result.data });
        });
    }

    function preWrite(next, apiName, methodName, methodMeta, jobId, args) {
        const methodType = methodMeta.entity;
        const key = createKey(apiName,
                              methodName,
                              methodMeta.multipleEntities,
                              args,
                              methodType,
                              jobId);
        saveToCache(key, {
            data: args[0]
        }, 'WRITE');

        const typeConfig = getTypeConfig(apiName, methodMeta.entity);
        invalidateCacheIfDesired(typeConfig, methodMeta.entity, args);

        return next(args);
    }

    function postWrite(apiName, methodName, methodMeta, jobId, args, promise) {
        if (temporaryIds[jobId] !== undefined) {
            temporaryIds[jobId].promise = promise;
        }

        const typeConfig = getTypeConfig(apiName, methodMeta.entity);
        promise.then(replaceTemporaryWithFinalId(methodMeta, jobId))
               .then(invalidateCacheIfDesired(typeConfig, methodMeta.entity, args));

        return promise;
    }

    function preDelete(next, apiName, methodName, methodMeta, jobId, args) {
        if (methodMeta.multipleEntities) {
            args[0].map(deleteFromCache(methodMeta.entity));
        } else {
            deleteFromCache(methodMeta.entity)(args[0]);
        }

        return next(args);
    }

    function deleteFromCache(type) {
        return entity => {
            delete storage[type][entity.id];
        };
    }

    function postDelete(promise) {
        return promise;
    }

    function invalidateCacheIfDesired(config, entityType, args) {
        if (newEntityWasCreated(args[0]) && config.invalidateOnCreate) {
            collectionQueries[entityType] = {};
        }
    }

    function newEntityWasCreated(entity) {
        return entity.id === undefined;
    }

    function replaceTemporaryWithFinalId(methodMeta, jobId) {
        return realEntity => {
            const tempId = temporaryIds[jobId].id;
            const entityWithTempId = storage[methodMeta.entity][tempId];
            delete storage[methodMeta.entity][tempId];
            storage[methodMeta.entity][realEntity.data.id] = entityWithTempId;
        }
    }

    function createKey(apiName, methodName, multipleEntities, args, type, jobId) {
        if (multipleEntities) {
            return {
                type: 'COLLECTION_KEY',
                value: [apiName, methodName, multipleEntities, args].join('-'),
                entityType: type
            };
        } else {
            return {
                type: 'ENTITY_KEY',
                entityType: type,
                id: args[0].id || createTemporaryId(jobId)
            };
        }
    }

    function createTemporaryId(jobId) {
        const id = generateEntityIdFromJobId(jobId);
        temporaryIds[jobId] = {
            id
        };
        return id;
    }

    function generateEntityIdFromJobId(jobId) {
        return 'TEMPORARY_ID_' + jobId;
    }

    function getTypeConfig(apiName, typeName) {
        if (config[typeName]) {
            return config[typeName];
        } else {
            return {};
        }
    }

    function getFromCache(methodConfig, key) {
        let value;

        if (key.type === 'COLLECTION_KEY') {
            value = getCollectionFromCache(key);
        } else {
            value = getEntityFromCache(key);
        }

        if (value && isValid(value, methodConfig, key)) {
            return value;
        } else {
            return false;
        }
    }

    function getCollectionFromCache(key) {
        if (collectionQueries[key.entityType] &&
            collectionQueries[key.entityType][key.value]) {
            return {
                data: collectionQueries[key.entityType][key.value].ids
                    .map((x) => getEntityDataIfExist(storage[key.entityType][x]))
                    .filter((x) => x !== null)
            };
        } else {
            return false;
        }
    }

    function getEntityDataIfExist(entity) {
        if (entity) {
            return entity.data;
        } else {
            return null;
        }
    }

    function getEntityFromCache(key) {
        if (storage[key.entityType][key.id]) {
            return storage[key.entityType][key.id];
        } else {
            return false;
        }
    }

    function isValid(item, methodConfig, key) {
        if (key.type === 'COLLECTION_KEY') {
            return collectionQueries[key.entityType][key.value].timestamp + methodConfig.ttl * 1000 >= Date.now();
        } else {
            return item.timestamp + methodConfig.ttl * 1000 >= Date.now();
        }
    }

    function saveToCache(key, val, operation) {
        const type = key.entityType;
        if (!storage[type]) {
            storage[type] = {};
        }

        if (key.type === 'COLLECTION_KEY') {
            saveCollection(key, type, val.data, operation);
        } else {
            saveEntity(key, type, val.data);
        }
    }

    function saveCollection(key, type, val, operation) {
        val.forEach((x) => {
            storage[type][x.id] = {
                data: x,
                timestamp: Date.now()
            };
        });

        if (operation !== 'WRITE') {
            const ids = val.map((x) => x.id);

            if (!collectionQueries[key.entityType]) {
                collectionQueries[key.entityType] = {};
            }

            collectionQueries[key.entityType][key.value] = {
                timestamp: Date.now(),
                ids
            };
        }
    }

    function saveEntity(key, type, val) {
        storage[type][key.id] = {
            data: val,
            timestamp: Date.now()
        };
    }
}
