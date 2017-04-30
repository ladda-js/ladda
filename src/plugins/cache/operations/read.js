import {passThrough, compose, curry, reduce, toIdMap, map, concat, zip} from 'ladda-fp';
import * as Cache from '../cache';
import {addId, removeId} from '../id-helper';

const getTtl = e => e.ttl * 1000;

// Entity -> Int -> Bool
const hasExpired = (e, timestamp) => {
  return (Date.now() - timestamp) > getTtl(e);
};

const readFromCache = curry((cache, e, aFn, id) => {
  if (Cache.containsEntity(cache, e, id) && !aFn.alwaysGetFreshData) {
    const v = Cache.getEntity(cache, e, id);
    if (!hasExpired(e, v.timestamp)) {
      return removeId(v.value);
    }
  }
  return undefined;
});

const decorateReadSingle = (c, cache, e, aFn) => {
  return (id) => {
    const fromCache = readFromCache(cache, e, aFn, id);
    if (fromCache) {
      return Promise.resolve(fromCache);
    }

    return aFn(id)
      .then(passThrough(compose(Cache.storeEntity(cache, e), addId(c, aFn, id))))
      .then(passThrough(() => Cache.invalidateQuery(cache, e, aFn)));
  };
};

const decorateReadSome = (c, cache, e, aFn) => {
  return (ids) => {
    const readFromCache_ = readFromCache(cache, e, aFn);
    const [cached, remaining] = reduce(([c_, r], id) => {
      const fromCache = readFromCache_(id);
      if (fromCache) {
        c_.push(fromCache);
      } else {
        r.push(id);
      }
      return [c_, r];
    }, [[], []], ids);

    if (!remaining.length) {
      return Promise.resolve(cached);
    }

    const addIds = map(([id, item]) => addId(c, aFn, id, item));

    return aFn(remaining)
      .then(passThrough(compose(Cache.storeEntities(cache, e), addIds, zip(remaining))))
      .then(passThrough(() => Cache.invalidateQuery(cache, e, aFn)))
      .then((other) => {
        const asMap = compose(toIdMap, concat)(cached, other);
        return map((id) => asMap[id], ids);
      });
  };
};

const decorateReadQuery = (c, cache, e, aFn) => {
  return (...args) => {
    if (Cache.containsQueryResponse(cache, e, aFn, args) && !aFn.alwaysGetFreshData) {
      const v = Cache.getQueryResponseWithMeta(cache, e, aFn, args);
      if (!hasExpired(e, v.timestamp)) {
        return Promise.resolve(removeId(Cache.getQueryResponse(v.value)));
      }
    }

    return aFn(...args)
      .then(passThrough(
            compose(Cache.storeQueryResponse(cache, e, aFn, args),
                    addId(c, aFn, args))))
      .then(passThrough(() => Cache.invalidateQuery(cache, e, aFn)));
  };
};

export function decorateRead(c, cache, notify, e, aFn) {
  if (aFn.byId) {
    return decorateReadSingle(c, cache, e, aFn);
  }
  if (aFn.byIds) {
    return decorateReadSome(c, cache, e, aFn);
  }
  return decorateReadQuery(c, cache, e, aFn);
}
