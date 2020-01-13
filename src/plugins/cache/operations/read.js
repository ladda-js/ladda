import {
  passThrough, compose, curry, reduce, toIdMap, map, concat, zip
} from 'ladda-fp';
import * as Cache from '../cache';
import {addId, removeId} from '../id-helper';

const readFromCache = curry((cache, e, aFn, id) => {
  if (Cache.containsEntity(cache, e, id) && !aFn.alwaysGetFreshData) {
    const v = Cache.getEntity(cache, e, id);
    if (!Cache.hasExpired(cache, e, v)) {
      return removeId(v.value);
    }
  }
  return undefined;
});

const decorateReadSingle = (c, cache, notify, e, aFn) => {
  return (id) => {
    const fromCache = readFromCache(cache, e, aFn, id);
    if (fromCache) {
      return Promise.resolve(fromCache);
    }

    return aFn(id)
      .then(passThrough(compose(x => Cache.storeEntity(cache, e, x), addId(c, aFn, id))))
      .then(passThrough(() => Cache.invalidateQuery(cache, e, aFn)))
      .then(passThrough(notify([id])));
  };
};

const decorateReadSome = (c, cache, notify, e, aFn) => {
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
      .then(passThrough(compose(xs => Cache.storeEntities(cache, e, xs), addIds, zip(remaining))))
      .then(passThrough(() => Cache.invalidateQuery(cache, e, aFn)))
      .then((other) => {
        const asMap = compose(toIdMap, concat)(cached, other);
        return map((id) => asMap[id], ids);
      })
      .then(passThrough(notify([remaining])));
  };
};

const decorateReadQuery = (c, cache, notify, e, aFn) => {
  return (...args) => {
    if (Cache.containsQueryResponse(cache, e, aFn, args) && !aFn.alwaysGetFreshData) {
      const v = Cache.getQueryResponseWithMeta(cache, c, e, aFn, args);
      if (!Cache.hasExpired(cache, e, v)) {
        return Promise.resolve(v.value ? removeId(Cache.getQueryResponse(v.value)) : null);
      }
    }

    return aFn(...args)
      .then(passThrough(
        compose(Cache.storeQueryResponse(cache, e, aFn, args),
          addId(c, aFn, args))
      ))
      .then(passThrough(() => Cache.invalidateQuery(cache, e, aFn)))
      .then(passThrough(notify(args)));
  };
};

export function decorateRead(c, cache, notify, e, aFn) {
  if (aFn.byId) {
    return decorateReadSingle(c, cache, notify, e, aFn);
  }
  if (aFn.byIds) {
    return decorateReadSome(c, cache, notify, e, aFn);
  }
  return decorateReadQuery(c, cache, notify, e, aFn);
}
