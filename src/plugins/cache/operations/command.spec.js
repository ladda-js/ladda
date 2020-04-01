/* eslint-disable @typescript-eslint/no-unused-expressions */

import sinon from 'sinon';
import {curry} from '../../../fp';
import {decorateCommand} from './command';
import * as Cache from '../cache';
import {createApiFunction} from '../test-helper';

const curryNoop = () => () => {};

const config = [
  {
    name: 'user',
    ttl: 300,
    api: {
      getUsers: (x) => x,
      deleteUser: (x) => x
    },
    invalidates: ['user'],
    invalidatesOn: ['GET']
  }
];

describe('Command', () => {
  describe('decorateCommand', () => {
    it('Updates cache based on return value', () => {
      const cache = Cache.createCache(config);
      const e = config[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);

      const res = decorateCommand({}, cache, curryNoop, e, aFn);
      return res('an arg', 'other args').then((nextXOrg) => {
        expect(Cache.getEntity(cache, e, 1).value).to.deep.equal({...nextXOrg, __ladda__id: 1});
      });
    });

    it('triggers an UPDATE notification', () => {
      const spy = sinon.spy();
      const n = curry((a, b) => spy(a, b));

      const cache = Cache.createCache(config);
      const e = config[0];
      const xOrg = {id: 1, name: 'Kalle'};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(xOrg));
      const aFn = sinon.spy(aFnWithoutSpy);

      const res = decorateCommand({}, cache, n, e, aFn);
      return res('an arg', 'other args').then((nextXOrg) => {
        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWith(['an arg', 'other args'], nextXOrg);
      });
    });
  });
});
