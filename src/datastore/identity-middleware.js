export function preRead(next, apiName, toDecorateName, multipleEntities, args) {
    return next(args);
}

export function preWrite(next, apiName, methodName, methodMeta, jobId, args) {
    return next(args);
}

export function postRead() {
}

export function postWrite(promise) {
    return promise;
}

export function preDelete(next, apiName, methodName, methodMeta, jobId, args) {
    return next(args);
}

export function postDelete(promise) {
    return promise;
}
