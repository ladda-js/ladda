import {map_, curry} from './fp';

export const invalidate = curry((queryCache, entity) => {
    map_(queryCache.invalidate, entity.invalidates);
});
