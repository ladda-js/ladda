/* eslint-disable no-unused-expressions */

import {createEntityStore} from './entity-store';
import {createQueryCache, getValue, put, contains, get, invalidate} from './query-cache';
import {addId} from './id-helper';
import {createSampleConfig, createApiFunction, createEntityConfig} from './test-helper';

const config = createSampleConfig();

describe('QueryCache', () => {
  describe('createQueryCache', () => {
    it('Returns an object', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      expect(qc).to.be.a('object');
    });
  });
  describe('getValue', () => {
    it('extracts values from an array of cache values and returns these', () => {
      const expected = [[1, 2, 3], [4, 5, 6]];
      const data = [{value: [1, 2, 3]}, {value: [4, 5, 6]}];
      expect(getValue(data)).to.deep.equal(expected);
    });
    it('extracts values from a cache value and returns it', () => {
      const expected = [1, 2, 3];
      const data = {value: [1, 2, 3]};
      expect(getValue(data)).to.deep.equal(expected);
    });
  });
  describe('contains & put', () => {
    it('if an element exist, return true', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const aFn = (x) => x;
      const args = [1, 2, 3];
      const xs = [{id: 1}, {id: 2}, {id: 3}];
      put(qc, e, aFn, args, addId({}, undefined, undefined, xs));
      expect(contains(qc, e, aFn, args)).to.be.true;
    });
    it('if an element exist, and args contains a complex object, return true', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const aFn = (x) => x;
      const args = [1, {hello: {world: 'Kalle'}}, 3];
      const xs = [{id: 1}, {id: 2}, {id: 3}];
      put(qc, e, aFn, args, addId({}, undefined, undefined, xs));
      expect(contains(qc, e, aFn, args)).to.be.true;
    });
    it('if an element exist, and args contains a simple object, return true', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const aFn = (x) => x;
      const args = [1, {hello: 'world'}, 3];
      const xs = [{id: 1}, {id: 2}, {id: 3}];
      put(qc, e, aFn, args, addId({}, undefined, undefined, xs));
      expect(contains(qc, e, aFn, args)).to.be.true;
    });
    it('if an element does not exist, return false', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const aFn = (x) => x;
      const args = [1, 2, 3];
      expect(contains(qc, e, aFn, args)).to.be.false;
    });
  });
  describe('get', () => {
    it('if an element exist, return it', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const aFn = (x) => x;
      const args = [1, 2, 3];
      const xs = [{id: 1}, {id: 2}, {id: 3}];
      const xsRet = [{id: 1, __ladda__id: 1}, {id: 2, __ladda__id: 2}, {id: 3, __ladda__id: 3}];
      put(qc, e, aFn, args, addId({}, undefined, undefined, xs));
      expect(getValue(get(qc, undefined, e, aFn, args).value)).to.deep.equal(xsRet);
    });
    it('if an does not exist, throw an error', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const aFn = (x) => x;
      const args = [1, 2, 3];
      const fnUnderTest = () => getValue(get(qc, e, aFn, args).value);
      expect(fnUnderTest).to.throw(Error);
    });
  });
  describe('invalidate', () => {
    it('invalidates other cache as specified', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const eUser = config[0];
      const eCars = config[2];
      const aFn = createApiFunction(x => x, {operation: 'CREATE'});
      const args = [1, 2, 3];
      const xs = [{id: 1}, {id: 2}, {id: 3}];
      put(qc, eUser, aFn, args, addId({}, undefined, undefined, xs));
      invalidate(qc, eCars, aFn);
      const hasUser = contains(qc, eUser, aFn, args);
      expect(hasUser).to.be.false;
    });
    it('does not crash when no invalidates specified', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const eBikes = config[3];
      const aFn = createApiFunction(x => x, {operation: 'CREATE'});
      aFn.operation = 'CREATE';
      const fn = () => invalidate(qc, eBikes, aFn);
      expect(fn).to.not.throw();
    });
    it('does not invalidate other cache that starts with the same string', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const eCars = config[2];
      const eUserSettings = config[4];
      const aFn = createApiFunction(x => x, {operation: 'CREATE'});
      const args = [1, 2, 3];
      const xs = [{id: 1}, {id: 2}, {id: 3}];
      put(qc, eUserSettings, aFn, args, addId({}, undefined, undefined, xs));
      invalidate(qc, eCars, aFn);
      const hasUserSettings = contains(qc, eUserSettings, aFn, args);
      expect(hasUserSettings).to.be.true;
    });
    it('invalidates a same-entity function that was called with no arguments', () => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const eUser = config[0];
      const getUsersFn = eUser.api.getUsers;
      getUsersFn.fnName = 'getUsers';
      const aFn = createApiFunction(x => x, {operation: 'NO_OPERATION', invalidates: ['getUsers']});
      const xs = [{id: 1}, {id: 2}];
      put(qc, eUser, getUsersFn, [], addId({}, undefined, undefined, xs));
      invalidate(qc, eUser, aFn);
      const hasUsers = contains(qc, eUser, getUsersFn, []);
      expect(hasUsers).to.be.false;
    });
    it('does not invalidate an exact cache key belonging to another entity', () => {
      const getFoo = createApiFunction(x => x, {operation: 'READ'});
      getFoo.fnName = 'bar';
      const eFoo = createEntityConfig({
        name: 'foo',
        api: {bar: getFoo}
      });
      const updateFooBar = createApiFunction(x => x, {operation: 'UPDATE'});
      const eFooBar = createEntityConfig({
        name: 'foo-bar',
        api: {update: updateFooBar},
        invalidates: ['foo-bar']
      });
      const es = createEntityStore([eFoo, eFooBar]);
      const qc = createQueryCache(es);
      const xs = [{id: 1}];

      put(qc, eFoo, getFoo, [], addId({}, undefined, undefined, xs));
      invalidate(qc, eFooBar, updateFooBar);

      const hasFoo = contains(qc, eFoo, getFoo, []);
      expect(hasFoo).to.be.true;
    });
  });
});
