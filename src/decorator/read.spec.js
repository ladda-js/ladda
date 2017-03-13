/* eslint-disable no-unused-expressions */

import sinon from 'sinon';
import {decorateRead} from './read';
import {createEntityStore} from '../entity-store';
import {createQueryCache} from '../query-cache';
import {createSampleConfig, createApiFunction} from '../test-helper';

const config = createSampleConfig();

describe('Read', () => {
  describe('decorateRead', () => {
    it('stores and returns an array with elements that lack id', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const xOrg = [{name: 'Kalle'}, {name: 'Anka'}];
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {idFrom: 'ARGS'});
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);
      res(1).then(x => {
        expect(x).to.deep.equal(xOrg);
        done();
      });
    });
    it('does set id to serialized args if idFrom ARGS', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const xOrg = {name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {idFrom: 'ARGS'});
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);
      res({hello: 'hej', other: 'svej'}).then(x => {
        expect(x).to.deep.equal({name: 'Kalle'});
        done();
      });
    });
    it('calls api fn if not in cache with byId set', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {byId: true});
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);
      res(1).then(() => {
        expect(aFn.callCount).to.equal(1);
        done();
      });
    });
    it('calls api fn if in cache, but expired, with byId set', (done) => {
      const myConfig = createSampleConfig();
      myConfig[0].ttl = 0;
      const es = createEntityStore(myConfig);
      const qc = createQueryCache(es);
      const e = myConfig[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {byId: true});
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);
      const delay = () => new Promise((resolve) => setTimeout(resolve, 1));
      res(1).then(delay).then(res.bind(null, 1)).then(() => {
        expect(aFn.callCount).to.equal(2);
        done();
      });
    });
    it('does not call api fn if in cache with byId set', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {byId: true});
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);
      res(1).then(res.bind(null, 1)).then(() => {
        expect(aFn.callCount).to.equal(1);
        done();
      });
    });
    it('calls api fn if not in cache', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);
      res(1).then(() => {
        expect(aFn.callCount).to.equal(1);
        done();
      });
    });
    it('does not call api fn if in cache', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);

      const firstCall = res(1);

      firstCall.then(() => {
        res(1).then(() => {
          expect(aFn.callCount).to.equal(1);
          done();
        });
      });
    });
    it('does call api fn if in cache but expired', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = {...config[0], ttl: -1};
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);

      const firstCall = res(1);

      firstCall.then(() => {
        res(1).then(() => {
          expect(aFn.callCount).to.equal(2);
          done();
        });
      });
    });
    it('calls api fn if not in cache (plural)', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const xOrg = [{id: 1, name: 'Kalle'}];
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);
      res(1).then((x) => {
        expect(x).to.equal(xOrg);
        done();
      });
    });
    it('does not call api fn if in cache (plural)', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = config[0];
      const xOrg = [{id: 1, name: 'Kalle'}];
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);

      const firstCall = res(1);

      firstCall.then(() => {
        res(1).then(() => {
          expect(aFn.callCount).to.equal(1);
          done();
        });
      });
    });
    it('does call api fn if in cache but expired (plural)', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = {...config[0], ttl: -1};
      const xOrg = [{id: 1, name: 'Kalle'}];
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);

      const firstCall = res(1);

      firstCall.then(() => {
        res(1).then(() => {
          expect(aFn.callCount).to.equal(2);
          done();
        });
      });
    });
    it('throws if id is missing', (done) => {
      const es = createEntityStore(config);
      const qc = createQueryCache(es);
      const e = {...config[0], ttl: 300};
      const xOrg = {name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, es, qc, e, aFn);

      res().catch(err => {
        expect(err).to.be.a('Error');
        done();
      });
    });
  });
});
