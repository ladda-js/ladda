import { Config, Entity } from '../../../types';
import * as Cache from '../cache';
import { addId } from '../id-helper';

export function decorateUpdate<R, E, A extends any[]>(
  config: Config,
  cache: Cache.Cache,
  // @ts-ignore Typescript gives a warning here, but it still works
  notify: (args:[E, ...A], r:E)=>void,
  e: Entity,
  // @ts-ignore Typescript gives a warning here, but it still works
  aFn: ApiFunction<R, [E, ...A]>
) {
  return async(eValue: E, ...args: A) => {
    const r = await aFn(eValue, ...args);
    Cache.invalidateQuery(cache, e, aFn);
    Cache.storeEntity(cache, e, addId(config, undefined, undefined, eValue));
    notify([eValue, ...args], eValue);
    return r;
  };
}
