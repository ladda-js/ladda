export function preRead(next, apiName, toDecorateName, multipleEntities, args) {
    return next(args);
}

export function preWrite(next, apiName, toDecorateName, multipleEntities, args) {
    return next(args);
}

export function postRead() {
}

export function postWrite(promise) {
    return promise;
}
