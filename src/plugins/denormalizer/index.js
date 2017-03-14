import {
  compose, curry, head, map, mapValues,
  prop, reduce, fromPairs, toPairs, toObject, values,
  uniq, flatten, get, set, snd
} from '../../fp';

export const NAME = 'denormalizer';

const toIdMap = toObject(prop('id'));

const getPluginConf = curry((configs, entityName) => compose(
  prop(NAME),
  prop('plugins'),
  prop(entityName)
)(configs));

const getApi = curry((configs, entityName) => compose(prop('api'), prop(entityName))(configs));

const getSchema = compose(prop('schema'), getPluginConf);

const getPluginConf_ = curry((config) => compose(
  prop(NAME),
  prop('plugins'),
)(config));
const getSchema_ = (config) => compose(prop('schema'), getPluginConf_)(config);

const collectTargets = curry((accessors, res, item) => {
  return reduce((m, [path, type]) => {
    let list = m[type];
    if (!list) { list = []; }
    const val = get(path, item)
    if (Array.isArray(val)) {
      list = list.concat(val);
    } else {
      list.push(val);
    }
    m[type] = list
    return m;
  }, res, accessors);
});

const resolveItem = curry((accessors, entities, item) => {
  return reduce((m, [path, type]) => {
    const val = get(path, item) // wasteful to do that all the time, try ealier
    const getById = (id) => entities[type][id];
    const resolvedVal = Array.isArray(val) ? map(getById, val) : getById(val);
    return set(path, resolvedVal, m);
  }, item, accessors);
});

const resolveItems = curry((accessors, items, entities) => {
  return map(resolveItem(accessors, entities), items);
});

const requestEntities = curry(({ getOne, getSome, getAll, threshold }, ids) => {
  const noOfItems = ids.length;

  if (noOfItems === 1) {
    return getOne(ids[0]).then((e) => [e]);
  }
  if (noOfItems > threshold) {
    return getAll();
  }
  return getSome(ids);
});

const resolve = curry((fetchers, accessors, items) => {
  const requestsToMake = compose(toPairs, reduce(collectTargets(accessors), {}))(items);
  return Promise.all(map(([t, ids]) => {
    return requestEntities(fetchers[t], ids).then((es) => [t, es]);
  }, requestsToMake)).then(
    compose(resolveItems(accessors, items), mapValues(toIdMap), fromPairs)
  );
});

const parseSchema = (schema) => {
  return reduce((m, [field, val]) => {
    if (Array.isArray(val) || typeof val === 'string') {
      m[field] = val;
    } else {
      const nextSchema = parseSchema(val);
      Object.keys(nextSchema).forEach((k) => {
        m[[field, k].join('.')] = nextSchema[k];
      });
    }
    return m;
  }, {}, toPairs(schema));
  return {};
};

export const extractAccessors = (configs) => {
  const asMap = reduce((m, c) => {
    const schema = getSchema_(c);
    if (schema) { m[c.name] = parseSchema(schema); }
    return m;
  }, {}, configs);
  return mapValues(compose(map(([ps, v]) => [ps.split('.'), v]), toPairs))(asMap);
};

const extractFetchers = (configs, types) => {
  return compose(fromPairs, map((t) => {
    const conf = getPluginConf(configs, t);
    const api = getApi(configs, t);
    if (!conf) {
      throw new Error(`No denormalizer config found for type ${t}`);
    }

    const fromApi = (p) => api[conf[p]];
    const getOne = fromApi('getOne');
    const getSome = fromApi('getSome') || ((is) => Promise.all(map(getOne, is)));
    const getAll = fromApi('getAll') || (() => getSome(ids));
    const threshold = fromApi('threshold') || 0;

    if (!getOne) {
      throw new Error(`No 'getOne' accessor defined on type ${t}`);
    }
    return [t, { getOne, getSome, getAll, threshold }];
  }))(types);
}

// Getters -> [Type]
const extractTypes = compose(uniq, flatten, map(snd), flatten, values);

export const denormalizer = () => ({ entityConfigs }) => {
  const allAccessors = extractAccessors(values(entityConfigs));
  const allFetchers = extractFetchers(entityConfigs, extractTypes(allAccessors));

  return ({ entity, apiFnName: name, apiFn: fn }) => {
    const accessors = allAccessors[entity.name];
    if (!accessors) {
      return fn;
    }
    return (...args) => {
      return fn(...args).then((res) => {
        const isArray = Array.isArray(res);
        const items = isArray ? res : [res];

        const resolved = resolve(allFetchers, accessors, items);
        return isArray ? resolved : resolved.then(head);
      });
    };
  }
};
