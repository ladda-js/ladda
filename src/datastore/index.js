import * as IdentityMiddleware from './identity-middleware';

let jobCounter = 0;

export function createDatastore() {
    return {
        _middleware: [ {name: 'identity', middleware: IdentityMiddleware} ],
        _apis: [],
        _built: false
    };
}

export function registerApi(name, api) {
    return datastore => {
        if (datastore._built) {
            throw new Error('Cannot register APIs after built');
        }

        return {
            ...datastore,
            _apis: [...datastore._apis, { name, api }]
        };
    };
}

export function registerMiddleware(middleware) {
    return datastore => {
        if (datastore._built) {
            throw new Error('Cannot register middleware after built');
        }

        return {
            ...datastore,
            _middleware: [...datastore._middleware, {  middleware }]
        };
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

        let deleteMethods = Object.keys(api.api).filter(x => api.api[x].type === 'DELETE');
        deleteMethods = createObject(deleteMethods,
                                     deleteMethods.map(decorateDelete(api, middleware)));

        return {
            _name: api.name,
            ...readMethods,
            ...writeMethods,
            ...deleteMethods
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

function bindPreWrite(hook, apiName, toDecorate, toDecorateName, jobId, middleware) {
    const [x, ...xs] = middleware;
    const methodMeta = createMethodMeta(toDecorate);
    if (xs.length === 0) {
        return x.middleware[hook].bind(null,
                                       (args) => toDecorate(...args),
                                       apiName,
                                       toDecorateName,
                                       methodMeta,
                                       jobId);
    } else {
        return x.middleware[hook].bind(
            null,
            bindPreWrite(hook, apiName, toDecorate, toDecorateName, jobId, xs),
            apiName,
            toDecorateName,
            methodMeta,
            jobId);
    }
}

function decorateWrite(api, middleware) {
    return (toDecorate) => {
        return (...args) => {
            const jobId = jobCounter++;

            const preWrite = bindPreWrite(
                'preWrite',
                api.name,
                api.api[toDecorate],
                toDecorate,
                jobId,
                middleware.filter((x) => x.middleware.preWrite));
            const result = preWrite(args);

            const postWriteMiddleware = middleware.filter((x) => x.middleware.postWrite);
            const methodMeta = createMethodMeta(api.api[toDecorate]);
            postWriteMiddleware.forEach((x) => x.middleware.postWrite(
                api.name,
                toDecorate,
                methodMeta,
                jobId,
                args,
                result));
            return result.then((x) => x.data);
        };
    };
}

function bindPreDelete(hook, apiName, toDecorate, toDecorateName, jobId, middleware) {
    const [x, ...xs] = middleware;
    const methodMeta = createMethodMeta(toDecorate);
    if (xs.length === 0) {
        return x.middleware[hook].bind(null,
                                       (args) => toDecorate(...args),
                                       apiName,
                                       toDecorateName,
                                       methodMeta,
                                       jobId);
    } else {
        return x.middleware[hook].bind(
            null,
            bindPreWrite(hook, apiName, toDecorate, toDecorateName, jobId, xs),
            apiName,
            toDecorateName,
            methodMeta,
            jobId);
    }
}

function decorateDelete(api, middleware) {
    return (toDecorate) => {
        return (...args) => {
            const jobId = jobCounter++;

            const preDelete = bindPreDelete(
                'preDelete',
                api.name,
                api.api[toDecorate],
                toDecorate,
                jobId,
                middleware.filter((x) => x.middleware.preDelete));
            const result = preDelete(args);

            const postDeleteMiddleware = middleware.filter((x) => x.middleware.postDelete);
            const methodMeta = createMethodMeta(api.api[toDecorate]);
            postDeleteMiddleware.forEach((x) => x.middleware.postDelete(
                api.name,
                toDecorate,
                methodMeta,
                jobId,
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
