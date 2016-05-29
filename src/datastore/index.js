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
        writeMethods = writeMethods.map(decorateWrite(api));

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

            const postReadMiddleware = middleware.filter((x) => x.middleware.preRead);
            const returnsMultipleEntities = api.api[toDecorate].returnsMultipleEntities;
            postReadMiddleware.forEach((x) => x.middleware.postRead(
                api.name,
                toDecorate,
                returnsMultipleEntities,
                args,
                result));
            return result.then((x) => x.data);
        };
    };
}

function bindPreRead(hook, apiName, toDecorate, toDecorateName, middleware) {
    const [x, ...xs] = middleware;

    if (xs.length === 0) {
        return x.middleware[hook].bind(null,
                                       (args) => toDecorate(...args),
                                       apiName,
                                       toDecorateName,
                                       toDecorate.returnsMultipleEntities);
    } else {
        return x.middleware[hook].bind(null,
                                       bindPreRead(hook, apiName, toDecorate, toDecorateName, xs),
                                       apiName,
                                       toDecorateName,
                                       toDecorate.returnsMultipleEntities);
    }
}

function decorateWrite(datastore) {
    return (toDecorate) => {
        return datastore[toDecorate];
    };
}

function createObject(keys, vals) {
    const obj = {};
    keys.forEach((key, index) => obj[key] = vals[index]);
    return obj;
}
