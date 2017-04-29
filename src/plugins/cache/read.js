import {passThrough, compose, curry, reduce, toIdMap, map, concat, zip} from 'ladda-fp';
import {get as getFromEs,
        put as putInEs,
        mPut as mPutInEs,
        contains as inEs} from './entity-store';
import {get as getFromQc,
        invalidate,
        put as putInQc,
        contains as inQc,
        getValue} from './query-cache';
import {addId, removeId} from './id-helper';

const getTtl = e => e.ttl * 1000;

// Entity -> Int -> Bool
const hasExpired = (e, timestamp) => {
  return (Date.now() - timestamp) > getTtl(e);
};

const readFromCache = curry((es, e, aFn, id) => {
  if (inEs(es, e, id) && !aFn.alwaysGetFreshData) {
    const v = getFromEs(es, e, id);
    if (!hasExpired(e, v.timestamp)) {
      return removeId(v.value);
    }
  }
  return undefined;
});

const decorateReadSingle = (c, es, qc, e, aFn) => {
  return (id) => {
    const fromCache = readFromCache(es, e, aFn, id);
    if (fromCache) {
      return Promise.resolve(fromCache);
    }

    return aFn(id)
      .then(passThrough(compose(putInEs(es, e), addId(c, aFn, id))))
      .then(passThrough(() => invalidate(qc, e, aFn)));
  };
};

const decorateReadSome = (c, es, qc, e, aFn) => {
  return (ids) => {
    const readFromCache_ = readFromCache(es, e, aFn);
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
      .then(passThrough(compose(mPutInEs(es, e), addIds, zip(remaining))))
      .then(passThrough(() => invalidate(qc, e, aFn)))
      .then((other) => {
        const asMap = compose(toIdMap, concat)(cached, other);
        return map((id) => asMap[id], ids);
      });
  };
};

const decorateReadQuery = (c, es, qc, e, aFn) => {
  return (...args) => {
    if (inQc(qc, e, aFn, args) && !aFn.alwaysGetFreshData) {
      const v = getFromQc(qc, e, aFn, args);
      if (!hasExpired(e, v.timestamp)) {
        return Promise.resolve(removeId(getValue(v.value)));
      }
    }

    return aFn(...args)
      .then(passThrough(compose(putInQc(qc, e, aFn, args), addId(c, aFn, args))))
      .then(passThrough(() => invalidate(qc, e, aFn)));
  };
};

export function decorateRead(c, es, qc, e, aFn) {
  if (aFn.byId) {
    return decorateReadSingle(c, es, qc, e, aFn);
  }
  if (aFn.byIds) {
    return decorateReadSome(c, es, qc, e, aFn);
  }
  return decorateReadQuery(c, es, qc, e, aFn);
}
