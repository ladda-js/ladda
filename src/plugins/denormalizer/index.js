import {
  compose, curry, head, map, mapValues,
  prop, reduce, fromPairs, toPairs, toObject, values,
  uniq, flatten
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

const collectTargets = curry((schema, res, item) => {
  // TODO need to traverse the schema all the way down, in case they are nested
  const keys = Object.keys(schema);
  return reduce((m, k) => {
    const type = schema[k];
    let list = m[type];
    if (!list) { list = []; }
    const val = item[k];
    // need to make sure we pass only unique values!
    if (typeof val === 'object') {
      // here we should traverse
      if (Array.isArray(val)) {
        list = list.concat(val);
      }
    } else {
      list.push(val);
    }
    if (list.length) {
      m[type] = list;
    }
    return m;
  }, res, keys);
});

const resolveItem = curry((schema, entities, item) => {
  // reuse traversal function
  const keys = Object.keys(schema);
  return reduce((m, k) => {
    const type = schema[k];
    const getById = (id) => entities[type][id];
    const val = item[k];
    // typically a drill down would be needed here, we just return
    // to make the original tests pass for now
    if (typeof val === 'object' && !Array.isArray(val)) {
      return m;
    }
    const resolvedVal = Array.isArray(val) ? map(getById, val) : getById(val);
    return { ...m, [k]: resolvedVal };
  }, item, keys);
});

const resolveItems = curry((schema, items, entities) => {
  return map(resolveItem(schema, entities), items);
});

const requestEntities = curry((config, api, ids) => {
  const fromApi = (p) => api[config[p]];
  const getOne = fromApi('getOne');
  const getSome = fromApi('getSome') || ((is) => Promise.all(map(getOne, is)));
  const getAll = fromApi('getAll') || (() => getSome(ids));
  const threshold = config.threshold || 0;

  const noOfItems = ids.length;

  if (noOfItems === 1) {
    return getOne(ids[0]).then((e) => [e]);
  }
  if (noOfItems > threshold) {
    return getAll();
  }
  return getSome(ids);
});

const resolve = curry((accessors, getters, items) => {
  const requestsToMake = compose(toPairs, reduce(collectTargets(getters), {}))(items);
  return Promise.all(map(([t, ids]) => {
    return requestEntities(accessors[t], ids).then((es) => [t, es]);
  }, requestsToMake)).then(
    compose(resolveItems(getters, items), mapValues(toIdMap), fromPairs)
  );
});

// TODO preprocess configuration. This has several benefits
// - We don't need traverse the config on the fly all the time
// - We can prepare a data structure which makes handling of nested data easy
// - We can validate if all necessary configuration is in place and fail fast if that's not the case

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
  return reduce((m, c) => {
    const schema = getSchema_(c);
    if (schema) { m[c.name] = parseSchema(schema); }
    return m;
  }, {}, configs);
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

    if (!getOne) {
      throw new Error(`No 'getOne' accessor defined on type ${t}`);
    }
    return [t, { getOne, getSome, getAll }];
  }))(types);
}

// Getters -> [Type]
const extractTypes = compose(uniq, flatten, flatten, map(values), values);

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
