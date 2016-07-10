import { invalidate as invalidateDatastore } from 'datastore';

export function invalidate(datastore, abstractEntity, operation) {
    const invalidateOn = abstractEntity.val.invalidatesOn || ['CREATE', 'DELETE'];
    if (invalidateOn.indexOf(operation) === -1) {
        return;
    }

    abstractEntity.val.invalidates.forEach(type => {
        invalidateDatastore(datastore, type);
    });
}
