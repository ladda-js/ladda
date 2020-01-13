import { ApiFunction, Config, Entity } from '../../../types';
import * as Cache from '../cache';
import { addId } from '../id-helper';

export function decorateCommand<R, A extends any[]>(
  config:Config,
  cache:Cache.Cache,
  notify:(args:A, r:R)=>void,
  e:Entity,
  aFn:ApiFunction<R, A>
) {
  return async(...args: A) => {
    const r = await aFn(...args);
    Cache.invalidateQuery(cache, e, aFn);
    Cache.storeEntity(cache, e, addId(config, undefined, undefined, r));
    // @ts-ignore
    notify([...args], r);
    return r;
  };
}
