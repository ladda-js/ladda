export function preRead(next, apiName, toDecorateName, multipleEntities, args) {
    return next(args);
}

export function preWrite(next, id, obj) {
    return next(id, obj);
}

export function postRead() {
}

export function postWrite(promise) {
    return promise;
}
