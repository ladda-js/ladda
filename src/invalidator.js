import { invalidate as invalidateDatastore } from 'datastore';

export function invalidateEntity(datastore, abstractEntity, operation) {
    const invalidateOn = abstractEntity.val.invalidatesOn || ['CREATE'];
    if (invalidateOn.indexOf(operation) === -1) {
        return;
    }

    abstractEntity.val.invalidates.forEach(type => {
        invalidateDatastore(datastore, type);
    });
}

export function invalidateFunction(datastore, abstractEntity, apiFn) {
    const type = abstractEntity.name;
    apiFn.invalidates.forEach(method => {
        invalidateDatastore(datastore, type, method);
    });
}
