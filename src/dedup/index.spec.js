/* eslint-disable no-unused-expressions */

import sinon from 'sinon';
import { dedup } from '.';

const delay = (cb, t = 5) => new Promise((res, rej) => {
  setTimeout(() => cb().then(res, rej), t);
});

describe('dedup', () => {
  describe('for operations other than READ', () => {
    it('just returns the original apiFn', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => Promise.resolve({ ...user }));
      fn.operation = 'UPDATE';
      const wrappedApiFn = dedup({})({ fn });
      expect(wrappedApiFn).to.equal(fn);
    });
  });

  describe('for READ operations', () => {
    it('wraps the function', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => Promise.resolve(user));
      fn.operation = 'READ';
      const wrappedApiFn = dedup({})({ fn });
      expect(wrappedApiFn).not.to.equal(fn);
    });

    it('makes several calls when apiFn is called with different args', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => Promise.resolve({ ...user }));
      fn.operation = 'READ';
      const wrappedApiFn = dedup({})({ fn });
      return Promise.all([
        wrappedApiFn('x'),
        wrappedApiFn('y')
      ]).then(() => {
        expect(fn).to.have.been.calledTwice;
      });
    });

    it('only makes one call when apiFn is called in identical args', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => delay(() => Promise.resolve({ ...user })));
      fn.operation = 'READ';
      const wrappedApiFn = dedup({})({ fn });
      return Promise.all([
        wrappedApiFn('x'),
        wrappedApiFn('x')
      ]).then(() => {
        expect(fn).to.have.been.calledOnce;
      });
    });

    it('detects complex arguments properly', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => delay(() => Promise.resolve({ ...user })));
      fn.operation = 'READ';
      const wrappedApiFn = dedup({})({ fn });
      return Promise.all([
        wrappedApiFn({ a: 1, b: [2, 3] }, 'a'),
        wrappedApiFn({ a: 1, b: [2, 3] }, 'a')
      ]).then(() => {
        expect(fn).to.have.been.calledOnce;
      });
    });

    it('passes the result of the single call to all callees', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => delay(() => Promise.resolve({ ...user })));
      fn.operation = 'READ';
      const wrappedApiFn = dedup({})({ fn });
      return Promise.all([
        wrappedApiFn(),
        wrappedApiFn()
      ]).then((res) => {
        expect(res[0]).to.deep.equal(user);
        expect(res[1]).to.deep.equal(user);
        expect(res[0]).to.equal(res[1]);
      });
    });

    it('makes subsequent calls if another calls is made after the first one is resolved', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => delay(() => Promise.resolve({ ...user })));
      fn.operation = 'READ';
      const wrappedApiFn = dedup({})({ fn });

      return wrappedApiFn().then(() => {
        return wrappedApiFn().then(() => {
          expect(fn).to.have.been.calledTwice;
        });
      });
    });

    it('also makes subsequent calls after the first one is rejected', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => delay(() => Promise.reject({ ...user })));
      fn.operation = 'READ';
      const wrappedApiFn = dedup({})({ fn });

      return wrappedApiFn().catch(() => {
        return wrappedApiFn().catch(() => {
          expect(fn).to.have.been.calledTwice;
        });
      });
    });

    it('propagates errors to all callees', () => {
      const error = { error: 'ERROR' };
      const fn = sinon.spy(() => delay(() => Promise.reject(error)));
      const wrappedApiFn = dedup({})({ fn });
      return Promise.all([
        wrappedApiFn().catch((err) => err),
        wrappedApiFn().catch((err) => err)
      ]).then((res) => {
        expect(res[0]).to.equal(error);
        expect(res[0]).to.equal(res[1]);
      });
    });

    it('can be disabled on a global level', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => delay(() => Promise.resolve({ ...user })));
      fn.operation = 'READ';
      const config = { enableDeduplication: false };
      const wrappedApiFn = dedup({ config })({ fn });

      return Promise.all([
        wrappedApiFn(),
        wrappedApiFn()
      ]).then(() => {
        expect(fn).to.have.been.calledTwice;
      });
    });

    it('can be disabled on an entity level', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => delay(() => Promise.resolve({ ...user })));
      fn.operation = 'READ';
      const entity = { enableDeduplication: false };
      const wrappedApiFn = dedup({})({ fn, entity });

      return Promise.all([
        wrappedApiFn(),
        wrappedApiFn()
      ]).then(() => {
        expect(fn).to.have.been.calledTwice;
      });
    });

    it('can be disabled on a function level', () => {
      const user = { id: 'x' };
      const fn = sinon.spy(() => delay(() => Promise.resolve({ ...user })));
      fn.operation = 'READ';
      fn.enableDeduplication = false;
      const wrappedApiFn = dedup({})({ fn });

      return Promise.all([
        wrappedApiFn(),
        wrappedApiFn()
      ]).then(() => {
        expect(fn).to.have.been.calledTwice;
      });
    });
  });
});
