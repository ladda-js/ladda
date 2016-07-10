// Concepts: AbstractEntity

import { decorateApi } from './decorator';
import { createDatastore } from './datastore';

export function build(config) {
    const abstractEntities = toAbstractFormat(config);
    const indexedEntities = toObject(abstractEntities.filter((x) => !x.val.viewOf), {});
    abstractEntities.forEach(registerViews(indexedEntities));
    abstractEntities.forEach(copyInvalidateToViews(indexedEntities));
    abstractEntities.forEach(decorateApi(createDatastore(createTtlMap(abstractEntities))));

    return toObject(abstractEntities, {});
}

function createTtlMap(abstractEntities) {
    return abstractEntities.reduce((memo, value) => {
        memo[value.name] = value.val.ttl;
        return memo;
    }, {});
}

function toAbstractFormat(config) {
    return Object.keys(config)
                 .map((name) => ({
                     name,
                     val: config[name]
                 }));
}

function registerViews(indexedEntities) {
    return abstractEntity => {
        if (isView(abstractEntity)) {
            registerView(indexedEntities, abstractEntity);
        }
    };
}

function registerView(indexedEntities, abstractEntity) {
    assertEntityExist(indexedEntities, abstractEntity);
    addView(indexedEntities[getViewOf(abstractEntity)],
            abstractEntity);
}

function assertEntityExist(indexedEntities, abstractEntity) {
    if (!indexedEntities[getViewOf(abstractEntity)]) {
        throw new Error('Tried to register view on ' +
                        getViewOf(abstractEntity) +
                        ' which does not exist');
    }
}

function addView(entity, abstractEntity) {
    if (!entity.views) {
        entity.views = [];
    }

    entity.views.push(getName(abstractEntity));
}

function getName(abstractEntity) {
    return abstractEntity.name;
}

function getViewOf(abstractEntity) {
    return abstractEntity.val.viewOf;
}

function isView(abstractEntity) {
    return !!abstractEntity.val.viewOf;
}

function copyInvalidateToViews(indexedEntities) {
    return (abstractEntity) => {
        if (isView(abstractEntity)) {
            assertEntityExist(indexedEntities, abstractEntity);
            addInvalidates(abstractEntity,
                           getInvalidates(indexedEntities[getViewOf(abstractEntity)]));
        }
    };
}

function addInvalidates(abstractEntity, invalidates) {
    if (abstractEntity.val.invalidates) {
        abstractEntity.val.invalidates.push(...invalidates);
    } else {
        abstractEntity.val.invalidates = invalidates;
    }
}

function getInvalidates(entity) {
    return entity.invalidates;
}

function toObject(val, obj) {
    if (!Array.isArray(val)) {
        return val;
    }

    val.forEach((x) => {
        obj[x.name] = toObject(x.val, {});
    });

    return obj;
}
