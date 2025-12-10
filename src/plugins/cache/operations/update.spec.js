/* eslint-disable no-unused-expressions */

import sinon from 'sinon';
import { curry } from 'ladda-fp';
import { decorateUpdate } from './update';
import * as Cache from '../cache';
import { createApiFunction } from '../test-helper';

const curryNoop = () => () => {};

const config = [
  {
    name: 'user',
    ttl: 300,
    api: {
      getUsers: x => x,
      getUsers2: x => x,
      deleteUser: x => x
    },
    invalidates: ['user'],
    invalidatesOn: ['GET']
  },
  {
    name: 'userPreview',
    ttl: 200,
    api: {
      getPreviews: x => x,
      updatePreview: x => x
    },
    invalidates: ['fda'],
    viewOf: 'user'
  },
  {
    name: 'listUser',
    ttl: 200,
    api: {
      getPreviews: x => x,
      updatePreview: x => x
    },
    invalidates: ['fda'],
    viewOf: 'user'
  }
];

describe('Update', () => {
  describe('decorateUpdate', () => {
    it('Updates cache based on argument', () => {
      const cache = Cache.createCache(config);
      const e = config[0];
      const xOrg = { id: 1, name: 'Kalle' };
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);

      const res = decorateUpdate({}, cache, curryNoop, e, aFn);
      return res(xOrg, 'other args').then(() => {
        expect(Cache.getEntity(cache, e, 1).value).to.deep.equal({ ...xOrg, __ladda__id: 1 });
      });
    });

    it('triggers an UPDATE notification', () => {
      const spy = sinon.spy();
      const n = curry((a, b) => spy(a, b));

      const cache = Cache.createCache(config);
      const e = config[0];
      const xOrg = { id: 1, name: 'Kalle' };
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);

      const res = decorateUpdate({}, cache, n, e, aFn);
      return res(xOrg, 'other args').then(() => {
        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith([xOrg, 'other args'], xOrg);
      });
    });
  });
  describe('with idFrom set', () => {
    it('Updates the cache based on idFrom', () => {
      const cache = Cache.createCache(config);
      const e = config[0];
      const xOrg = { objectId: 1, name: 'Kalle' };
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg),
      { idFrom: o => o.objectId });
      const aFn = sinon.spy(aFnWithoutSpy);

      const res = decorateUpdate({}, cache, curryNoop, e, aFn);
      return res(xOrg, 'other args').then(() => {
        expect(Cache.getEntity(cache, e, 1).value).to.deep.equal({ ...xOrg, __ladda__id: 1 });
      });
    });
  });
});
