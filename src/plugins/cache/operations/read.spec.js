/* eslint-disable @typescript-eslint/no-unused-expressions */

import sinon from 'sinon';
import {curry, map} from 'ladda-fp';
import {decorateRead} from './read';
import {createCache} from '../cache';
import {createSampleConfig, createApiFunction} from '../test-helper';

const curryNoop = () => () => {};
const config = createSampleConfig();

describe('Read', () => {
  describe('decorateRead', () => {
    it('stores and returns an array with elements that lack id', () => {
      const cache = createCache(config);
      const e = config[0];
      const xOrg = [{name: 'Kalle'}, {name: 'Anka'}];
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {idFrom: 'ARGS'});
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, curryNoop, e, aFn);
      return res(1).then(x => {
        expect(x).to.deep.equal(xOrg);
      });
    });

    it('does set id to serialized args if idFrom ARGS', () => {
      const cache = createCache(config);
      const e = config[0];
      const xOrg = {name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {idFrom: 'ARGS'});
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, curryNoop, e, aFn);
      return res({hello: 'hej', other: 'svej'}).then(x => {
        expect(x).to.deep.equal({name: 'Kalle'});
      });
    });

    describe('with byId set', () => {
      it('calls api fn if not in cache', () => {
        const cache = createCache(config);
        const e = config[0];
        const xOrg = {id: 1, name: 'Kalle'};
        const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {byId: true});
        const aFn = sinon.spy(aFnWithoutSpy);
        const res = decorateRead({}, cache, curryNoop, e, aFn);
        return res(1).then(() => {
          expect(aFn.callCount).to.equal(1);
        });
      });

      it('calls api fn if in cache, but expired', () => {
        const myConfig = createSampleConfig();
        myConfig[0].ttl = 0;
        const cache = createCache(myConfig);
        const e = myConfig[0];
        const xOrg = {id: 1, name: 'Kalle'};
        const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {byId: true});
        const aFn = sinon.spy(aFnWithoutSpy);
        const res = decorateRead({}, cache, curryNoop, e, aFn);
        const delay = () => new Promise((resolve) => setTimeout(resolve, 1));
        return res(1).then(delay).then(res.bind(null, 1)).then(() => {
          expect(aFn.callCount).to.equal(2);
        });
      });

      it('does not call api fn if in cache', () => {
        const cache = createCache(config);
        const e = config[0];
        const xOrg = {id: 1, name: 'Kalle'};
        const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {byId: true});
        const aFn = sinon.spy(aFnWithoutSpy);
        const res = decorateRead({}, cache, curryNoop, e, aFn);
        return res(1).then(res.bind(null, 1)).then(() => {
          expect(aFn.callCount).to.equal(1);
        });
      });

      it('triggers notify when not in cache', () => {
        const spy = sinon.spy();
        const n = curry((a, b) => spy(a, b));
        const cache = createCache(config);
        const e = config[0];
        const xOrg = {id: 1, name: 'Kalle'};
        const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {byId: true});
        const aFn = sinon.spy(aFnWithoutSpy);
        const res = decorateRead({}, cache, n, e, aFn);
        return res(1).then((r) => {
          expect(spy).to.have.been.calledWith([1], r);
        });
      });

      it('does not trigger notify when in cache', () => {
        const spy = sinon.spy();
        const n = curry((a, b) => spy(a, b));
        const cache = createCache(config);
        const e = config[0];
        const xOrg = {id: 1, name: 'Kalle'};
        const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg), {byId: true});
        const aFn = sinon.spy(aFnWithoutSpy);
        const res = decorateRead({}, cache, n, e, aFn);
        return res(1).then(res.bind(null, 1)).then(() => {
          expect(spy).to.have.been.calledOnce; // and not a second time for the cache hit
        });
      });
    });

    describe('with byIds', () => {
      const users = {
        a: { id: 'a' },
        b: { id: 'b' },
        c: { id: 'c' }
      };

      const fn = (ids) => Promise.resolve(map((id) => users[id], ids));
      const decoratedFn = createApiFunction(fn, { byIds: true });

      it('calls api fn if nothing in cache', () => {
        const cache = createCache(config);
        const e = config[0];
        const fnWithSpy = sinon.spy(decoratedFn);
        const apiFn = decorateRead({}, cache, curryNoop, e, fnWithSpy);
        return apiFn(['a', 'b']).then((res) => {
          expect(res).to.deep.equal([users.a, users.b]);
        });
      });

      it('calls api fn if nothing in cache', () => {
        const cache = createCache(config);
        const e = config[0];
        const fnWithSpy = sinon.spy(decoratedFn);
        const apiFn = decorateRead({}, cache, curryNoop, e, fnWithSpy);
        return apiFn(['a', 'b']).then((res) => {
          expect(res).to.deep.equal([users.a, users.b]);
        });
      });

      it('puts item in the cache and can read them again', () => {
        const cache = createCache(config);
        const e = config[0];
        const fnWithSpy = sinon.spy(decoratedFn);
        const apiFn = decorateRead({}, cache, curryNoop, e, fnWithSpy);
        const args = ['a', 'b'];
        return apiFn(args).then(() => {
          return apiFn(args).then((res) => {
            expect(fnWithSpy).to.have.been.calledOnce;
            expect(res).to.deep.equal([users.a, users.b]);
          });
        });
      });

      it('only makes additional request for uncached items', () => {
        const cache = createCache(config);
        const e = config[0];
        const fnWithSpy = sinon.spy(decoratedFn);
        const apiFn = decorateRead({}, cache, curryNoop, e, fnWithSpy);
        return apiFn(['a', 'b']).then(() => {
          return apiFn(['b', 'c']).then(() => {
            expect(fnWithSpy).to.have.been.calledTwice;
            expect(fnWithSpy).to.have.been.calledWith(['a', 'b']);
            expect(fnWithSpy).to.have.been.calledWith(['c']);
          });
        });
      });

      it('returns all items in correct order when making partial requests', () => {
        const cache = createCache(config);
        const e = config[0];
        const fnWithSpy = sinon.spy(decoratedFn);
        const apiFn = decorateRead({}, cache, curryNoop, e, fnWithSpy);
        return apiFn(['a', 'b']).then(() => {
          return apiFn(['a', 'b', 'c']).then((res) => {
            expect(res).to.deep.equal([users.a, users.b, users.c]);
          });
        });
      });

      it('triggers notify when not in cache', () => {
        const spy = sinon.spy();
        const n = curry((a, b) => spy(a, b));
        const cache = createCache(config);
        const e = config[0];
        const fnWithSpy = sinon.spy(decoratedFn);
        const apiFn = decorateRead({}, cache, n, e, fnWithSpy);
        return apiFn(['a', 'b']).then((r) => {
          expect(spy).to.have.been.calledOnce;
          expect(spy).to.have.been.calledWith([['a', 'b']], r);
        });
      });

      it('triggers notify when not in cache for partial request', () => {
        const spy = sinon.spy();
        const n = curry((a, b) => spy(a, b));
        const cache = createCache(config);
        const e = config[0];
        const fnWithSpy = sinon.spy(decoratedFn);
        const apiFn = decorateRead({}, cache, n, e, fnWithSpy);
        return apiFn(['a', 'b']).then(() => {
          spy.reset();
          return apiFn(['a', 'b', 'c']).then((r) => {
            expect(spy).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith([['c']], r);
          });
        });
      });

      it('does not trigger notify when in cache', () => {
        const spy = sinon.spy();
        const n = curry((a, b) => spy(a, b));
        const cache = createCache(config);
        const e = config[0];
        const fnWithSpy = sinon.spy(decoratedFn);
        const apiFn = decorateRead({}, cache, n, e, fnWithSpy);
        return apiFn(['a', 'b']).then(() => {
          spy.reset();
          return apiFn(['a', 'b']).then(() => {
            expect(spy).not.to.have.been.called;
          });
        });
      });
    });

    it('calls api fn if not in cache', () => {
      const cache = createCache(config);
      const e = config[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, curryNoop, e, aFn);
      return res(1).then(() => {
        expect(aFn.callCount).to.equal(1);
      });
    });

    it('does not call api fn if in cache', () => {
      const cache = createCache(config);
      const e = config[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, curryNoop, e, aFn);

      const firstCall = res(1);

      return firstCall.then(() => {
        return res(1).then(() => {
          expect(aFn.callCount).to.equal(1);
        });
      });
    });

    it('does call api fn if in cache but expired', () => {
      const cache = createCache(config);
      const e = {...config[0], ttl: -1};
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, curryNoop, e, aFn);

      const firstCall = res(1);

      return firstCall.then(() => {
        return res(1).then(() => {
          expect(aFn.callCount).to.equal(2);
        });
      });
    });

    it('calls api fn if not in cache (plural)', () => {
      const cache = createCache(config);
      const e = config[0];
      const xOrg = [{id: 1, name: 'Kalle'}];
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, curryNoop, e, aFn);
      return res(1).then((x) => {
        expect(x).to.equal(xOrg);
      });
    });

    it('does not call api fn if in cache (plural)', () => {
      const cache = createCache(config);
      const e = config[0];
      const xOrg = [{id: 1, name: 'Kalle'}];
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, curryNoop, e, aFn);

      const firstCall = res(1);

      return firstCall.then(() => {
        return res(1).then(() => {
          expect(aFn.callCount).to.equal(1);
        });
      });
    });

    it('does call api fn if in cache but expired (plural)', () => {
      const cache = createCache(config);
      const e = {...config[0], ttl: -1};
      const xOrg = [{id: 1, name: 'Kalle'}];
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, curryNoop, e, aFn);

      const firstCall = res(1);

      return firstCall.then(() => {
        return res(1).then(() => {
          expect(aFn.callCount).to.equal(2);
        });
      });
    });

    it('throws if id is missing', () => {
      const cache = createCache(config);
      const e = {...config[0], ttl: 300};
      const xOrg = {name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, curryNoop, e, aFn);

      return res().catch(err => {
        expect(err).to.be.a('Error');
      });
    });

    it('triggers notify when not in cache', () => {
      const spy = sinon.spy();
      const n = curry((a, b) => spy(a, b));
      const cache = createCache(config);
      const e = config[0];
      const xOrg = [{id: 1, name: 'Kalle'}];
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, n, e, aFn);

      return res(1).then((r) => {
        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith([1], r);
      });
    });

    it('does not trigger notify when in cache', () => {
      const spy = sinon.spy();
      const n = curry((a, b) => spy(a, b));
      const cache = createCache(config);
      const e = config[0];
      const xOrg = [{id: 1, name: 'Kalle'}];
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateRead({}, cache, n, e, aFn);

      const firstCall = res(1);

      return firstCall.then(() => {
        spy.reset();
        return res(1).then(() => {
          expect(spy).not.to.have.been.called;
        });
      });
    });
  });
});
