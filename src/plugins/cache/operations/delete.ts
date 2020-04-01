import { ApiFunction, Config, Entity } from '../../../types';
import * as Cache from '../cache';
import { serialize } from '../serializer';

export function decorateDelete<R, A extends any[]>(
  c: Config,
  cache: Cache.Cache,
  notify: (args: A, r:R)=>void,
  e: Entity,
  aFn: ApiFunction<R, A>
) {
  return async(...args:A) => {
    const r = await aFn(...args);
    Cache.invalidateQuery(cache, e, aFn);

    // Even those the precise type is more than string,
    // in practice we don't expect it to be anything but strings
    const id = serialize(args[0]) as string;
    const removed = Cache.removeEntity(cache, e, id);
    if (removed) {
      // @ts-ignore Variance issue that doesn't matter because `removed` is readonly
      notify(args, removed);
    }

    return r;
  };
}
