import * as IdentityMiddleware from './identity-middleware';

export function createDatastore() {
    return {
        _middleware: [ {name: 'identity', middleware: IdentityMiddleware} ],
        _apis: [],
        _built: false
    };
}

export function registerApi(name, api, datastore) {
    if (datastore._built) {
        throw new Error('Cannot register APIs after built');
    }

    return {
        ...datastore,
        _apis: [...datastore._apis, { name, api }]
    };
}

export function registerMiddleware(name, middleware, datastore) {
    if (datastore._built) {
        throw new Error('Cannot register middleware after built');
    }

    return {
        ...datastore,
        _middleware: [...datastore._middleware, { name, middleware }]
    };
}

export function build(datastore) {
    const builtDatastore = {
        _built: true,
    };

    const apis = datastore._apis.map(buildApi(datastore._middleware));
    apis.forEach(api => builtDatastore[api._name] = api);

    return builtDatastore;
}

function buildApi(middleware) {
    return (api) => {
        let readMethods = Object.keys(api.api).filter(x => api.api[x].type === 'READ');
        readMethods = createObject(readMethods,
                                   readMethods.map(decorateRead(api, middleware)));

        let writeMethods = Object.keys(api.api).filter(x => api.api[x].type === 'WRITE');
        writeMethods = createObject(writeMethods,
                                    writeMethods.map(decorateWrite(api, middleware)));

        return {
            _name: api.name,
            ...readMethods,
            ...writeMethods
        };
    };
}

function decorateRead(api, middleware) {
    return (toDecorate) => {
        return (...args) => {

            const preRead = bindPreRead(
                'preRead',
                api.name,
                api.api[toDecorate],
                toDecorate,
                middleware.filter((x) => x.middleware.preRead));
            const result = preRead(args);

            const postReadMiddleware = middleware.filter((x) => x.middleware.postRead);
            const methodMeta = createMethodMeta(api.api[toDecorate]);
            postReadMiddleware.forEach((x) => x.middleware.postRead(
                api.name,
                toDecorate,
                methodMeta,
                args,
                result));
            return result.then((x) => x.data);
        };
    };
}

function bindPreRead(hook, apiName, toDecorate, toDecorateName, middleware) {
    const [x, ...xs] = middleware;
    const methodMeta = createMethodMeta(toDecorate);
    if (xs.length === 0) {
        return x.middleware[hook].bind(null,
                                       (args) => toDecorate(...args),
                                       apiName,
                                       toDecorateName,
                                       methodMeta);
    } else {
        return x.middleware[hook].bind(null,
                                       bindPreRead(hook, apiName, toDecorate, toDecorateName, xs),
                                       apiName,
                                       toDecorateName,
                                       methodMeta);
    }
}

function bindPreWrite(hook, apiName, toDecorate, toDecorateName, middleware) {
    const [x, ...xs] = middleware;
    const methodMeta = createMethodMeta(toDecorate);
    if (xs.length === 0) {
        return x.middleware[hook].bind(null,
                                       (args) => toDecorate(...args),
                                       apiName,
                                       toDecorateName,
                                       methodMeta);
    } else {
        return x.middleware[hook].bind(null,
                                       bindPreWrite(hook, apiName, toDecorate, toDecorateName, xs),
                                       apiName,
                                       toDecorateName,
                                       methodMeta);
    }
}

function decorateWrite(api, middleware) {
    return (toDecorate) => {
        return (...args) => {
            const preWrite = bindPreWrite(
                'preWrite',
                api.name,
                api.api[toDecorate],
                toDecorate,
                middleware.filter((x) => x.middleware.preWrite));
            const result = preWrite(args);

            const postWriteMiddleware = middleware.filter((x) => x.middleware.postWrite);
            const methodMeta = createMethodMeta(api.api[toDecorate]);
            postWriteMiddleware.forEach((x) => x.middleware.postWrite(
                api.name,
                toDecorate,
                methodMeta,
                args,
                result));
            return result.then((x) => x.data);
        };
    };
}

function createMethodMeta(method) {
    return {
        multipleEntities: method.multipleEntities,
        entity: method.entity,
    };
}

function createObject(keys, vals) {
    const obj = {};
    keys.forEach((key, index) => obj[key] = vals[index]);
    return obj;
}
