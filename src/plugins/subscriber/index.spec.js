/* eslint-disable no-unused-expressions */

import sinon from 'sinon';

import { build } from '../../builder';
import { compose, map, toIdMap, values } from '../../fp';
import { subscriber as plugin } from '.';

const delay = (t = 1) => new Promise(res => setTimeout(() => res(), t));
const toMiniUser = ({ id, name }) => ({ id, name });

const createUserApi = (container) => {
  const getUser = (id) => Promise.resolve(container[id]);
  getUser.operation = 'READ';
  getUser.byId = true;
  const getUsers = () => Promise.resolve(values(container));
  getUsers.operation = 'READ';

  const updateUser = (nextUser) => {
    const { id } = nextUser;
    const user = container[id];
    container[id] = { ...user, ...nextUser };
    return Promise.resolve(container[id]);
  };
  updateUser.operation = 'UPDATE';

  const removeUser = (id) => {
    delete container[id];
    Promise.resolve();
  };
  removeUser.operation = 'DELETE';

  return { getUser, getUsers, updateUser, removeUser };
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
      api: createUserApi(users)
    },
    mediumUser: {
      api: createUserApi(users),
      viewOf: 'user',
      invalidates: ['activity']
    },
    miniUser: {
      api: createUserApi(miniUsers),
      viewOf: 'miniUser'
    },
    activity: {
      api: { getActivities }
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
          const initialCallCount = spy1.callCount;

          return api.user.updateUser({ id: 'peter', name: 'Peter' }).then(() => {
            expect(spy1.callCount).to.equal(initialCallCount + 1);
            expect(spy2.callCount).to.equal(initialCallCount + 1);

            subscriber.destroy();

            return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              expect(spy1.callCount).to.equal(initialCallCount + 1);
              expect(spy2.callCount).to.equal(initialCallCount + 1);
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

      it('takes an optional second callback invoked on error', () => {
        const spy = sinon.spy();
        const errSpy = sinon.spy();
        const error = { err: 'x' };
        const config = createConfig();
        config.user.api.getUsers = () => Promise.reject(error);
        config.user.api.getUsers.operation = 'READ';

        const api = build(config, [plugin()]);
        const subscriber = api.user.getUsers.createSubscriber();

        subscriber.subscribe(spy, errSpy);

        return delay().then(() => {
          expect(spy).not.to.have.been.called;
          expect(errSpy).to.have.been.calledOnce;
          expect(errSpy).to.have.been.calledWith(error);
        });
      });

      // eslint-disable-next-line max-len
      it('several parallel subscriptions guarantee to call each subscription only once initially', () => {
        const spies = [sinon.spy(), sinon.spy(), sinon.spy()];
        const api = build(createConfig(), [plugin()]);

        const subscriber = api.user.getUsers.createSubscriber();
        spies.forEach((spy) => subscriber.subscribe(spy));

        return delay().then(() => {
          spies.forEach((spy) => expect(spy.callCount).to.equal(1));
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

      it('takes the arguments of the create call and passes them to the api call', () => {
        const config = createConfig();
        const stub = sinon.stub();
        const spy = sinon.spy();
        stub.returns(Promise.resolve([]));
        stub.operation = 'READ';
        config.user.api.getUsers = stub;
        const api = build(config, [plugin()]);
        const subscriber = api.user.getUsers.createSubscriber(1, 2, 3);
        subscriber.subscribe(spy);

        return delay().then(() => {
          expect(stub).to.have.been.calledWith(1, 2, 3);
        });
      });

      describe('with views', () => {
        it('notices changes to a child view', () => {
          const spy = sinon.spy();
          const api = build(createConfig(), [plugin()]);
          const subscriber = api.user.getUsers.createSubscriber();

          subscriber.subscribe(spy);

          return delay().then(() => {
            expect(spy).to.have.been.calledOnce;

            return api.miniUser.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              expect(spy).to.have.been.calledTwice;
            });
          });
        });

        it('notices changes to a parent view', () => {
          const spy = sinon.spy();
          const api = build(createConfig(), [plugin()]);
          const subscriber = api.miniUser.getUsers.createSubscriber();

          subscriber.subscribe(spy);

          return delay().then(() => {
            expect(spy).to.have.been.calledOnce;

            return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              expect(spy).to.have.been.calledTwice;
            });
          });
        });

        it('notices direct invalidations', () => {
          const spy = sinon.spy();
          const api = build(createConfig(), [plugin()]);
          const subscriber = api.activity.getActivities.createSubscriber();

          subscriber.subscribe(spy);

          return delay().then(() => {
            expect(spy).to.have.been.calledOnce;

            return api.mediumUser.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              expect(spy).to.have.been.calledTwice;
            });
          });
        });

        it('notices indirect invalidations (through a parent)', () => {
          const spy = sinon.spy();
          const api = build(createConfig(), [plugin()]);
          const subscriber = api.activity.getActivities.createSubscriber();

          subscriber.subscribe(spy);

          return delay().then(() => {
            expect(spy).to.have.been.calledOnce;

            return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              expect(spy).to.have.been.calledTwice;
            });
          });
        });

        it('notices indirect invalidations (through a child)', () => {
          const spy = sinon.spy();
          const api = build(createConfig(), [plugin()]);
          const subscriber = api.activity.getActivities.createSubscriber();

          subscriber.subscribe(spy);

          return delay().then(() => {
            expect(spy).to.have.been.calledOnce;

            return api.miniUser.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              expect(spy).to.have.been.calledTwice;
            });
          });
        });
      });
    });
  });
});
