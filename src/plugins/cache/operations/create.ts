import { ApiFunction, Config, Entity } from '../../../types';
import {
  Cache, invalidateQuery, storeCreateEvent, storeEntity
} from '../cache';
import { addId, getId } from '../id-helper';

export function decorateCreate<R, A extends any[]>(
  c: Config,
  cache: Cache,
  notify: (args:A, r:R)=>void,
  e: Entity,
  aFn: ApiFunction<R, A>
) {
  return async(...args:A) => {
    const r = await aFn(...args);
    invalidateQuery(cache, e, aFn);
    storeEntity(cache, e, addId(c, aFn, args, r));
    storeCreateEvent(cache, e, getId(c, aFn, args, r));
    notify(args, r);
    return r;
  };
}
