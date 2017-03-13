import { compose, curry, head, map, mapValues, prop, reduce, fromPairs, toPairs, toObject } from '../fp';

export const NAME = 'denormalizer';

const toIdMap = toObject(prop('id'));

const getPluginConf = curry((configs, entityName) => compose(
  prop(NAME),
  prop('plugins'),
  prop(entityName)
)(configs));

const getApi = curry((configs, entityName) => compose(prop('api'), prop(entityName))(configs));

const getSchema = compose(prop('schema'), getPluginConf);

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

const resolve = curry((entityConfigs, schema, items) => {
  const requestsToMake = compose(toPairs, reduce(collectTargets(schema), {}))(items);
  return Promise.all(map(([t, ids]) => {
    const conf = getPluginConf(entityConfigs, t);
    const api = getApi(entityConfigs, t);
    return requestEntities(conf, api, ids).then((es) => [t, es]);
  }, requestsToMake)).then(
    compose(resolveItems(schema, items), mapValues(toIdMap), fromPairs)
  );
});

// TODO preprocess configuration. This has several benefits
// - We don't need traverse the config on the fly all the time
// - We can prepare a data structure which makes handling of nested data easy
// - We can validate if all necessary configuration is in place and fail fast if that's not the case

export const denormalizer = curry((
  { entityConfigs },
  { entity, apiFnName: name, apiFn: fn }
) => {
  const schema = getSchema(entityConfigs, entity.name);
  if (!schema) {
    return fn;
  }
  return (...args) => {
    return fn(...args).then((res) => {
      const isArray = Array.isArray(res);
      const items = isArray ? res : [res];

      const resolved = resolve(entityConfigs, schema, items);
      return isArray ? resolved : resolved.then(head);
    });
  };
});
