/* eslint-disable no-unused-expressions */

import sinon from 'sinon';
import {decorateNotifier} from './notifier';
import * as Cache from '../cache';
import {createSampleConfig} from '../test-helper';

const config = createSampleConfig();

describe('DecorateNotifier', () => {
  it('Invalidates as if it was the specified operation', (done) => {
    const cache = Cache.createCache(config);
    const e = config[0];
    e.invalidatesOn = ['READ'];
    const xOrg = {__ladda__id: 1, name: 'Kalle'};
    const aFn = sinon.spy(() => Promise.resolve({}));
    const getUsers = () => Promise.resolve(xOrg);
    aFn.operation = 'READ';
    aFn.isNotifier = true;
    aFn.invalidates = [];
    Cache.storeQueryResponse(cache, e, getUsers, ['args'], xOrg);
    const res = decorateNotifier({}, cache, e, aFn);
    res(xOrg).then(() => {
      const killedCache = !Cache.containsQueryResponse(cache, e, getUsers, ['args']);
      expect(killedCache).to.be.true;
      done();
    });
  });
  it('Does not invalidate if operation does not cause invalidation', (done) => {
    const cache = Cache.createCache(config);
    const e = config[0];
    e.invalidatesOn = ['READ'];
    const xOrg = {__ladda__id: 1, name: 'Kalle'};
    const aFn = sinon.spy(() => Promise.resolve({}));
    const getUsers = () => Promise.resolve(xOrg);
    aFn.operation = 'DELETE';
    aFn.isNotifier = true;
    aFn.invalidates = [];
    Cache.storeQueryResponse(cache, e, getUsers, ['args'], xOrg);
    const res = decorateNotifier({}, cache, e, aFn);
    res(xOrg).then(() => {
      const killedCache = !Cache.containsQueryResponse(cache, e, getUsers, ['args']);
      expect(killedCache).to.be.false;
      done();
    });
  });
  it('Does not write to cache', (done) => {
    const cache = Cache.createCache(config);
    const e = config[0];
    const xOrg = {__ladda__id: 1, name: 'Kalle'};
    const aFn = sinon.spy(() => Promise.resolve({}));
    aFn.operation = 'CREATE';
    aFn.isNotifier = false;
    aFn.invalidates = [];
    const res = decorateNotifier({}, cache, e, aFn);
    res(xOrg).then(() => {
      const hasEntity = Cache.containsEntity(cache, e, 1);
      expect(hasEntity).to.be.false;
      done();
    });
  });
});
