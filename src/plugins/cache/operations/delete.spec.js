import sinon from 'sinon';
import {decorateDelete} from './delete';
import * as Cache from '../cache';
import {addId} from '../id-helper';
import {createApiFunction} from '../test-helper';

const curryNoop = () => () => {};

const config = [
  {
    name: 'user',
    ttl: 300,
    api: {
      getUsers: (x) => x,
      getUsers2: (x) => x,
      deleteUser: (x) => x
    },
    invalidates: ['user'],
    invalidatesOn: ['GET']
  },
  {
    name: 'userPreview',
    ttl: 200,
    api: {
      getPreviews: (x) => x,
      updatePreview: (x) => x
    },
    invalidates: ['fda'],
    viewOf: 'user'
  },
  {
    name: 'listUser',
    ttl: 200,
    api: {
      getPreviews: (x) => x,
      updatePreview: (x) => x
    },
    invalidates: ['fda'],
    viewOf: 'user'
  }
];

describe('Delete', () => {
  describe('decorateDelete', () => {
    it('Removes cache', (done) => {
      const cache = Cache.createCache(config);
      const e = config[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve({}));
      const aFn = sinon.spy(aFnWithoutSpy);
      Cache.storeEntity(cache, e, addId({}, undefined, undefined, xOrg));
      const res = decorateDelete({}, cache, curryNoop, e, aFn);
      res(1).then(() => {
        expect(Cache.getEntity(cache, e, 1)).to.equal(undefined);
        done();
      });
    });
  });
});
