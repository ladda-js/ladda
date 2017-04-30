import sinon from 'sinon';
import {decorateUpdate} from './update';
import * as Cache from '../cache';
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

describe('Update', () => {
  describe('decorateUpdate', () => {
    it('Updates cache based on argument', (done) => {
      const cache = Cache.createCache(config);
      const e = config[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);

      const res = decorateUpdate({}, cache, curryNoop, e, aFn);
      res(xOrg, 'other args').then(() => {
        expect(Cache.getEntity(cache, e, 1).value).to.deep.equal({...xOrg, __ladda__id: 1});
        done();
      });
    });
  });
});
