import sinon from 'sinon';
import { dedup } from '.';

const delay = (cb, t = 5) => new Promise((res, rej) => {
  setTimeout(() => cb().then(res, rej), t);
});

describe('dedup', () => {
  describe('for operations other than READ', () => {
    it('just returns the original apiFn', () => {
      const user = { id: 'x' };
      const apiFn = sinon.spy(() => Promise.resolve(user));
      apiFn.operation = 'UPDATE';
      const wrappedApiFn = dedup({})({ apiFn, apiFnName: 'apiFn' });
      expect(wrappedApiFn).to.equal(apiFn);
    });
  });

  describe('for READ operations', () => {
    it('wraps the function', () => {
      const user = { id: 'x' };
      const apiFn = sinon.spy(() => Promise.resolve(user));
      apiFn.operation = 'READ';
      const wrappedApiFn = dedup({})({ apiFn, apiFnName: 'apiFn' });
      expect(wrappedApiFn).not.to.equal(apiFn);
    });

    it('makes several calls when apiFn is called with different args', () => {
      const user = { id: 'x' };
      const apiFn = sinon.spy(() => Promise.resolve(user));
      apiFn.operation = 'READ';
      const wrappedApiFn = dedup({})({ apiFn, apiFnName: 'apiFn' });
      return Promise.all([
        wrappedApiFn('x'),
        wrappedApiFn('y')
      ]).then(() => {
        expect(wrappedApiFn).to.have.been.calledTwice();
      });
    });

    it('only makes one call when apiFn is called in identical args', () => {
      const user = { id: 'x' };
      const apiFn = sinon.spy(delay(() => Promise.resolve(user)));
      apiFn.operation = 'READ';
      const wrappedApiFn = dedup({})({ apiFn, apiFnName: 'apiFn' });
      return Promise.all([
        wrappedApiFn('x'),
        wrappedApiFn('x')
      ]).then(() => {
        expect(wrappedApiFn).to.have.been.calledOnce();
      });
    });

    it('passes the result of the single call to all callees', () => {
      const user = { id: 'x' };
      const apiFn = sinon.spy(delay(() => Promise.resolve(user)));
      apiFn.operation = 'READ';
      const wrappedApiFn = dedup({})({ apiFn, apiFnName: 'apiFn' });
      return Promise.all([
        wrappedApiFn(),
        wrappedApiFn()
      ]).then((res) => {
        expect(res[0]).to.equal(user);
        expect(res[1]).to.equal(user);
      });
    });

    it('makes subsequent calls if another calls is made after the first one is resolved', () => {
      const user = { id: 'x' };
      const apiFn = sinon.spy(delay(() => Promise.resolve(user)));
      apiFn.operation = 'READ';
      const wrappedApiFn = dedup({})({ apiFn, apiFnName: 'apiFn' });

      return wrappedApiFn().then(() => {
        return wrappedApiFn().then(() => {
          expect(wrappedApiFn).to.have.been.calledTwice();
        });
      });
    });

    // it('propagates errors to all callees', () => {
    //   const user = { id: 'x' };
    //   const apiFn = sinon.spy(delay(() => Promise.reject(user)));
    //   const wrappedApiFn = dedup({})({ apiFn, apiFnName: 'apiFn' });
    // });
  });
});
