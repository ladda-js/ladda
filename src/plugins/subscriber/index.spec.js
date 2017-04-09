/* eslint-disable no-unused-expressions */

import sinon from 'sinon';

import { build } from '../../builder';
import { toIdMap, values } from '../../fp';
import { subscriber as plugin } from '.';

const delay = (t = 1) => new Promise(res => setTimeout(() => res(), t));

const createConfig = () => {
  const peter = { id: 'peter', name: 'peter' };
  const gernot = { id: 'gernot', name: 'gernot' };
  const robin = { id: 'robin', name: 'robin' };

  const users = toIdMap([peter, gernot, robin]);

  const getUser = (id) => Promise.resolve(users[id]);
  getUser.operation = 'READ';
  getUser.byId = true;
  const getUsers = () => Promise.resolve(values(users));
  getUsers.operation = 'READ';

  const updateUser = (nextUser) => {
    const { id } = nextUser;
    const user = users[id];
    users[id] = { ...user, ...nextUser };
    return Promise.resolve(users[id]);
  };
  updateUser.operation = 'UPDATE';

  const removeUser = (id) => {
    delete users[id];
    Promise.resolve();
  };
  removeUser.operation = 'DELETE';

  return {
    user: {
      api: { getUser, getUsers, updateUser, removeUser }
    }
  };
};


describe('subscriber plugin', () => {
  it('patches fns so that a subscriber can be created on READ operations', () => {
    const api = build(createConfig(), [plugin()]);
    expect(api.user.getUsers.createSubscriber).to.be.a('function');
    expect(api.user.getUser.createSubscriber).to.be.a('function');
  });

  it('does not patch other operations than read', () => {
    const api = build(createConfig(), [plugin()]);
    expect(api.user.removeUser.createSubscriber).not.to.be;
    expect(api.user.updateUser.createSubscriber).not.to.be;
  });

  describe('createSubscriber()', () => {
    it('returns a subscriber shape', () => {
      const api = build(createConfig(), [plugin()]);
      const subscriber = api.user.getUsers.createSubscriber();
      expect(subscriber.useArgs).to.be.a('function');
      expect(subscriber.destroy).to.be.a('function');
      expect(subscriber.subscribe).to.be.a('function');
      expect(subscriber.alive).to.be.true;
    });
  });

  describe('subscriber', () => {
    describe('destroy', () => {
      it('removes all subscriptions', () => {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const api = build(createConfig(), [plugin()]);

        const subscriber = api.user.getUsers.createSubscriber();
        subscriber.subscribe(spy1);
        subscriber.subscribe(spy2);

        return delay().then(() => {
          expect(spy1).to.have.been.calledOnce;
          expect(spy2).to.have.been.calledOnce;

          return api.user.updateUser({ id: 'peter', name: 'Peter' }).then(() => {
            expect(spy1).to.have.been.calledTwice;
            expect(spy2).to.have.been.calledTwice;

            subscriber.destroy();

            return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              expect(spy1).to.have.been.calledTwice;
              expect(spy2).to.have.been.calledTwice;
            });
          });
        });
      });

      it('marks a subscriber as destroyed', () => {
        const api = build(createConfig(), [plugin()]);
        const subscriber = api.user.getUsers.createSubscriber();
        expect(subscriber.alive).to.be.true;

        subscriber.destroy();
        expect(subscriber.alive).to.be.false;
      });
    });

    describe('subscribe', () => {
      it('immediately invokes for the first time', () => {
        const spy = sinon.spy();
        const api = build(createConfig(), [plugin()]);
        const subscriber = api.user.getUsers.createSubscriber();

        subscriber.subscribe(spy);

        return delay().then(() => {
          expect(spy).to.have.been.calledOnce;
        });
      });

      it('returns an unsuscribe function', () => {
        const spy = sinon.spy();
        const api = build(createConfig(), [plugin()]);
        const subscriber = api.user.getUsers.createSubscriber();

        const unsubscribe = subscriber.subscribe(spy);

        return delay().then(() => {
          expect(spy).to.have.been.calledOnce;
          unsubscribe();

          return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
            expect(spy).to.have.been.calledOnce;
          });
        });
      });

      it('calls the callback again when a relevant change happens', () => {
        const spy = sinon.spy();
        const api = build(createConfig(), [plugin()]);
        const subscriber = api.user.getUsers.createSubscriber();

        subscriber.subscribe(spy);

        return delay().then(() => {
          expect(spy).to.have.been.calledOnce;

          return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
            expect(spy).to.have.been.calledTwice;
            return api.user.updateUser({ id: 'peter', name: 'PETer' }).then(() => {
              expect(spy).to.have.been.calledThrice;
            });
          });
        });
      });

      it('invokes the callback with no arguments by default', () => {
        const spy = sinon.spy();
        const api = build(createConfig(), [plugin()]);
        const subscriber = api.user.getUsers.createSubscriber();

        subscriber.subscribe(spy);

        return delay().then(() => {
          expect(spy).to.have.been.calledOnce;

          return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
            expect(spy).to.have.been.calledTwice;
          });
        });
      });
    });

    describe('useArgs', () => {
      it('', () => {

      });
    });
  });
});
