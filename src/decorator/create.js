import { invalidateEntity, invalidateFunction } from 'invalidator';
import { createQuery, createQueryFromItem } from 'query';
import {
    addItem,
    createItem,
    replaceTempId
} from 'datastore';

export function decorateCreate(apiFn, datastore, abstractEntity) {
    const type = abstractEntity.name;
    return (item) => {
        const createPromise = apiFn(item);
        const insertId = createItem(datastore,
                                    createQueryFromItem(type, item),
                                    item,
                                    createPromise);

        createInViews(datastore, abstractEntity, item, insertId);

        createPromise.then((result) => {
            replaceTempIdInItemAndViews(datastore, abstractEntity, insertId, result);
            invalidateEntity(datastore, abstractEntity, 'CREATE');
            invalidateFunction(datastore, abstractEntity, apiFn);
        });

        return createPromise;
    };
}

function replaceTempIdInItemAndViews(datastore, abstractEntity, insertId, result) {
    const types = [abstractEntity.name, ...abstractEntity.val.views];
    types.forEach(type => {
        replaceTempId(datastore, createQuery(type, insertId), result.id);
    });
}

function createInViews(datastore, abstractEntity, item, insertId) {
    const types = abstractEntity.val.views;
    types.forEach(type => {
        addItem(datastore, createQuery(type, insertId), item);
    });
}
