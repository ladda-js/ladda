import { invalidate } from 'invalidator';
import { createQueryFromItem } from 'query';
import {
    updateItem,
    patchItem
} from 'datastore';

export function decorateUpdate(apiFn, datastore, abstractEntity) {
    return (item) => {
        updateItemAndViews(datastore, abstractEntity, item);
        updateSuperEntity(datastore, abstractEntity, item);
        const result = apiFn(item);
        result.then(() => {
            invalidate(datastore, abstractEntity, 'UPDATE');
        });
        return result;
    };
}

function updateItemAndViews(datastore, abstractEntity, item) {
    const types = [abstractEntity.name, ...abstractEntity.val.views];
    types.forEach(type => {
        updateItem(datastore, createQueryFromItem(type, item), item);
    });
}

function updateSuperEntity(datastore, abstractEntity, item) {
    const superEntity = abstractEntity.val.viewOf;
    if (!superEntity) {
        return;
    }
    patchItem(datastore, createQueryFromItem(superEntity, item), item);
}
