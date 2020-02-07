/* eslint-disable @typescript-eslint/no-unused-expressions */

import sinon from 'sinon';

import {
  compose, map, toIdMap, values
} from 'ladda-fp';
import { build } from '../../builder';
import logger from '.';

const toMiniUser = ({ id, name }) => ({ id, name });

const ERROR = { err: 'error' };

const createUserApi = (container) => {
  const getUser = (id) => Promise.resolve(container[id]);
  getUser.operation = 'READ';
  getUser.byId = true;
  const getUsers = () => Promise.resolve(values(container));
  getUsers.operation = 'READ';

  const getUsersRejected = () => Promise.reject(ERROR);
  getUsersRejected.operation = 'READ';

  const updateUser = (nextUser) => {
    const { id } = nextUser;
    const user = container[id];
    container[id] = { ...user, ...nextUser };
    return Promise.resolve(container[id]);
  };
  updateUser.operation = 'UPDATE';

  const createUser = (user) => {
    container[user.id] = user;
    return Promise.resolve(user);
  };
  createUser.operation = 'CREATE';

  const removeUser = (id) => {
    delete container[id];
    return Promise.resolve();
  };
  removeUser.operation = 'DELETE';

  return {
    getUser, getUsers, getUsersRejected, createUser, updateUser, removeUser
  };
};

const createConfig = () => {
  const peter = { id: 'peter', name: 'peter', location: 'gothenburg' };
  const gernot = { id: 'gernot', name: 'gernot', location: 'graz' };
  const robin = { id: 'robin', name: 'robin', location: 'berlin' };

  const list = [peter, gernot, robin];
  const users = toIdMap(list);
  const miniUsers = compose(toIdMap, map(toMiniUser))(list);

  const getActivities = () => Promise.resolve([]);
  getActivities.operation = 'READ';

  return {
    user: {
      api: createUserApi(users),
      invalidates: ['activity']
    },
    miniUsers: {
      api: createUserApi(miniUsers),
      viewOf: 'user',
      invalidates: ['activity']
    },
    activity: {
      api: { getActivities }
    }
  };
};

const createMockLogger = () => ({
  log: sinon.spy(),
  info: sinon.spy(),
  warn: sinon.spy(),
  error: sinon.spy(),
  group: sinon.spy(),
  groupCollapsed: sinon.spy(),
  groupEnd: sinon.spy()
});

const createLogger = (implementation, conf = {}) => logger({
  implementation,
  noFormat: true,
  ...conf
});

const createFormatLogger = (implementation, conf = {}) => logger({
  implementation,
  noFormat: false,
  ...conf
});

const resetSpies = (l) => {
  Object.keys(l).forEach((k) => l[k].reset());
};

describe('Ladda logger', () => {
  describe('with a no format logger', () => {
    it('pass disable: true to disable logging', () => {
      const l = createMockLogger();
      const api = build(createConfig(), [createLogger(l, { disable: true })]);
      expect(l.log).not.to.have.been.called;
      return api.user.getUsers().then(() => {
        expect(l.log).not.to.have.been.called;
      });
    });

    it('logs on startup', () => {
      const l = createMockLogger();
      build(createConfig(), [createLogger(l)]);
      expect(l.log).to.have.been.calledOnce;
    });

    it('logs on successful api calls', () => {
      const l = createMockLogger();
      const api = build(createConfig(), [createLogger(l)]);
      expect(l.log).to.have.been.calledOnce;

      return api.user.getUsers().then(() => {
        expect(l.log).to.have.calledThrice;
      });
    });

    it('logs on failed api calls', () => {
      const l = createMockLogger();
      const api = build(createConfig(), [createLogger(l)]);
      expect(l.log).to.have.been.calledOnce;

      return api.user.getUsersRejected().catch(() => {
        expect(l.log).to.have.been.calledTwice;
        const { args } = l.log.getCall(1);
        expect(args[0]).to.match(/user.getUsersRejected/);
        expect(args[1]).to.equal(ERROR);
        expect(args[2]).to.match(/args/);
        expect(args[3]).to.be.empty;
      });
    });

    it('logs changes in the cache', () => {
      const l = createMockLogger();
      const api = build(createConfig(), [createLogger(l)]);
      expect(l.log).to.have.been.called;

      return api.user.getUsers().then(() => {
        expect(l.log).to.have.calledThrice;
      });
    });
  });

  describe('with a format logger', () => {
    const expectSetupGroup = (l) => {
      expect(l.groupCollapsed).to.have.been.calledOnce;
      expect(l.log).to.have.been.calledTwice;
      expect(l.groupEnd).to.have.been.calledOnce;
    };

    it('pass disable: true to disable logging', () => {
      const l = createMockLogger();
      const api = build(createConfig(), [createFormatLogger(l, { disable: true })]);
      expect(l.log).not.to.have.been.called;
      return api.user.getUsers().then(() => {
        expect(l.log).not.to.have.been.called;
      });
    });

    it('logs on startup', () => {
      const l = createMockLogger();
      build(createConfig(), [createFormatLogger(l)]);

      expectSetupGroup(l);
    });

    it('properly logs group based on the collapse flag', () => {
      const l = createMockLogger();
      build(createConfig(), [createFormatLogger(l, { collapse: false })]);
      expect(l.groupCollapsed).not.to.have.been.calledOnce;
      expect(l.group).to.have.been.calledOnce;
      expect(l.log).to.have.been.calledTwice;
      expect(l.groupEnd).to.have.been.calledOnce;
    });


    it('logs on successful api calls', () => {
      const l = createMockLogger();
      const api = build(createConfig(), [createFormatLogger(l)]);
      expectSetupGroup(l);
      resetSpies(l);

      return api.user.getUsers().then(() => {
        expect(l.groupCollapsed).to.have.been.calledTwice;
        expect(l.log).to.have.callCount(4);
        expect(l.groupEnd).to.have.been.calledTwice;
      });
    });

    it('logs on failed api calls', () => {
      const l = createMockLogger();
      const api = build(createConfig(), [createFormatLogger(l)]);
      expectSetupGroup(l);
      resetSpies(l);

      return api.user.getUsersRejected().catch(() => {
        expect(l.log).to.have.been.calledTwice;
        expect(l.groupCollapsed).to.have.been.calledOnce;
        expect(l.log).to.have.been.calledTwice;
        expect(l.groupEnd).to.have.been.calledOnc;
      });
    });

    it('logs changes in the cache', () => {
      const l = createMockLogger();
      const api = build(createConfig(), [createFormatLogger(l)]);
      expectSetupGroup(l);
      resetSpies(l);

      return api.user.getUsers().then(() => {
        expect(l.groupCollapsed).to.have.been.calledTwice;
        expect(l.log).to.have.callCount(4);
        expect(l.groupEnd).to.have.been.calledTwice;
      });
    });
  });
});
