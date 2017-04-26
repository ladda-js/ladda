/* eslint-disable no-unused-expressions */

import sinon from 'sinon';

import { compose, map, toIdMap, values } from 'ladda-fp';
import { build } from 'ladda-cache';
import { observable as plugin } from '.';

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

  return { getUser, getUsers, createUser, updateUser, removeUser };
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
      viewOf: 'mediumUser'
    },
    activity: {
      api: { getActivities }
    }
  };
};


describe('observable plugin', () => {
  it('patches fns so that an observable can be created on READ operations', () => {
    const api = build(createConfig(), [plugin()]);
    expect(api.user.getUsers.createObservable).to.be.a('function');
    expect(api.user.getUser.createObservable).to.be.a('function');
  });

  it('does not patch other operations than read', () => {
    const api = build(createConfig(), [plugin()]);
    expect(api.user.removeUser.createObservable).not.to.be;
    expect(api.user.updateUser.createObservable).not.to.be;
  });


  describe('createObservable()', () => {
    it('returns an observable shape', () => {
      const api = build(createConfig(), [plugin()]);
      const observable = api.user.getUsers.createObservable();
      expect(observable.subscribe).to.be.a('function');
    });
  });

  describe('observable', () => {
    describe('subscribe', () => {
      it('immediately invokes for the first time', () => {
        const spy = sinon.spy();
        const api = build(createConfig(), [plugin()]);
        const observable = api.user.getUsers.createObservable();

        observable.subscribe(spy);

        return delay().then(() => {
          expect(spy).to.have.been.calledOnce;
        });
      });

      it('returns a Disposable', () => {
        const spy = sinon.spy();
        const api = build(createConfig(), [plugin()]);
        const observable = api.user.getUsers.createObservable();

        const disposable = observable.subscribe(spy);

        return delay().then(() => {
          expect(spy).to.have.been.calledOnce;
          disposable.unsubscribe();

          return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
            expect(spy).to.have.been.calledOnce;
          });
        });
      });

      it('calls the callback again when a relevant change happens', () => {
        const spy = sinon.spy();
        const api = build(createConfig(), [plugin()]);
        const observable = api.user.getUsers.createObservable();

        observable.subscribe(spy);

        return delay().then(() => {
          expect(spy).to.have.been.calledOnce;

          return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
            return delay().then(() => {
              expect(spy).to.have.been.calledTwice;
              return api.user.updateUser({ id: 'peter', name: 'PETer' }).then(() => {
                return delay().then(() => {
                  expect(spy).to.have.been.calledThrice;
                });
              });
            });
          });
        });
      });

      it('does not trigger the callback when an unrelated change happens', () => {
        const spy = sinon.spy();
        const api = build(createConfig(), [plugin()]);
        const observable = api.user.getUsers.createObservable();

        observable.subscribe(spy);

        return delay().then(() => {
          expect(spy).to.have.been.calledOnce;

          return api.activity.getActivities().then(() => {
            expect(spy).to.have.been.calledOnce;
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
        const observable = api.user.getUsers.createObservable();

        observable.subscribe(spy, errSpy);

        return delay().then(() => {
          expect(spy).not.to.have.been.called;
          expect(errSpy).to.have.been.calledOnce;
          expect(errSpy).to.have.been.calledWith(error);
        });
      });

      // this is different from e.g. rxjs, which immediately terminates a subscription on error
      it('also invokes error callback in later stages of the subscription\'s lifecycle', () => {
        const spy = sinon.spy();
        const errSpy = sinon.spy();
        const error = { err: 'x' };
        const config = createConfig();
        config.user.api.getUsers = () => Promise.reject(error);
        config.user.api.getUsers.operation = 'READ';

        const api = build(config, [plugin()]);
        const observable = api.user.getUsers.createObservable();

        observable.subscribe(spy, errSpy);

        return delay().then(() => {
          expect(spy).not.to.have.been.called;
          expect(errSpy).to.have.been.calledOnce;
          expect(errSpy).to.have.been.calledWith(error);

          return api.user.createUser({ id: 'x', name: 'y' }).then(() => {
            return delay().then(() => {
              expect(spy).not.to.have.been.called;
              expect(errSpy).to.have.been.calledTwice;
            });
          });
        });
      });

      // eslint-disable-next-line max-len
      it('several parallel subscriptions guarantee to call each subscription only once initially', () => {
        const spies = [sinon.spy(), sinon.spy(), sinon.spy()];
        const api = build(createConfig(), [plugin()]);

        const observable = api.user.getUsers.createObservable();
        spies.forEach((spy) => observable.subscribe(spy));

        return delay().then(() => {
          spies.forEach((spy) => expect(spy.callCount).to.equal(1));
        });
      });

      it('unsubscribing one subscription does not affect another', () => {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const api = build(createConfig(), [plugin()]);

        const observable = api.user.getUsers.createObservable();
        const subscription1 = observable.subscribe(spy1);
        observable.subscribe(spy2);

        return delay().then(() => {
          expect(spy1).to.have.been.calledOnce;
          expect(spy2).to.have.been.calledOnce;
          subscription1.unsubscribe();

          return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
            return delay().then(() => {
              expect(spy1).to.have.been.calledOnce;
              expect(spy2).to.have.been.calledTwice;
            });
          });
        });
      });

      it('invokes the callback with no arguments by default', () => {
        const spy = sinon.spy();
        const api = build(createConfig(), [plugin()]);
        const observable = api.user.getUsers.createObservable();

        observable.subscribe(spy);

        return delay().then(() => {
          expect(spy).to.have.been.calledOnce;

          return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
            return delay().then(() => {
              expect(spy).to.have.been.calledTwice;
            });
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
        const observable = api.user.getUsers.createObservable(1, 2, 3);
        observable.subscribe(spy);

        return delay().then(() => {
          expect(stub).to.have.been.calledWith(1, 2, 3);
        });
      });

      describe('with views', () => {
        it('notices changes to a child view', () => {
          const spy = sinon.spy();
          const api = build(createConfig(), [plugin()]);
          const observable = api.user.getUsers.createObservable();

          observable.subscribe(spy);

          return delay().then(() => {
            expect(spy).to.have.been.calledOnce;
            return api.miniUser.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              return delay().then(() => {
                expect(spy).to.have.been.calledTwice;
              });
            });
          });
        });

        it('notices changes to a parent view', () => {
          const spy = sinon.spy();
          const api = build(createConfig(), [plugin()]);
          const observable = api.miniUser.getUsers.createObservable();

          observable.subscribe(spy);

          return delay().then(() => {
            expect(spy).to.have.been.calledOnce;

            return api.user.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              return delay().then(() => {
                expect(spy).to.have.been.calledTwice;
              });
            });
          });
        });

        it('notices direct invalidations', () => {
          const spy = sinon.spy();
          const api = build(createConfig(), [plugin()]);
          const observable = api.activity.getActivities.createObservable();

          observable.subscribe(spy);

          return delay().then(() => {
            expect(spy).to.have.been.calledOnce;

            return api.mediumUser.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              return delay().then(() => {
                expect(spy).to.have.been.calledThrice;
              });
            });
          });
        });

        it('calls api fns only AFTER they have been invalidated (on update)', () => {
          const config = createConfig();
          const state = {
            activities: [{ id: 'a' }]
          };
          config.activity.api.getActivities = () => Promise.resolve(state.activities);
          config.activity.api.getActivities.operation = 'READ';

          const spy = sinon.spy();
          const api = build(config, [plugin()]);
          const observable = api.activity.getActivities.createObservable();

          observable.subscribe(spy);

          return delay().then(() => {
            expect(spy).to.have.been.calledOnce;

            const firstArgs = spy.args[0];
            expect(firstArgs.length).to.equal(1);

            state.activities = [...state.activities, { id: 'b' }];

            return api.mediumUser.updateUser({ id: 'peter', name: 'PEter' }).then(() => {
              return delay().then(() => {
                // TODO
                // Ideally this should be called only twice:
                // 1. The initial subscription
                // 2. The call after the invalidation by updateUser
                //
                // The third call happens after 2. - as this call also creates
                // an update event. The subscription is consuming its own event.
                // Not ideal, but not trivial to fix.
                expect(spy).to.have.been.calledThrice;
                const secondArgs = spy.args[1];
                expect(secondArgs[0].length).to.equal(2);
              });
            });
          });
        });

        it('calls api fns only AFTER they have been invalidated (on create)', () => {
          const config = createConfig();
          const state = {
            activities: [{ id: 'a' }]
          };
          config.activity.api.getActivities = () => Promise.resolve(state.activities);
          config.activity.api.getActivities.operation = 'READ';

          const spy = sinon.spy();
          const api = build(config, [plugin()]);
          const observable = api.activity.getActivities.createObservable();

          observable.subscribe(spy);

          return delay().then(() => {
            expect(spy).to.have.been.calledOnce;

            const firstArgs = spy.args[0];
            expect(firstArgs.length).to.equal(1);

            state.activities = [...state.activities, { id: 'b' }];

            return api.mediumUser.createUser({ id: 'timur', name: 'Timur' }).then(() => {
              return delay().then(() => {
                expect(spy).to.have.been.calledThrice;
                const secondArgs = spy.args[1];
                expect(secondArgs[0].length).to.equal(2);
              });
            });
          });
        });

        it('calls api fns only AFTER they have been invalidated (on remove)', () => {
          const config = createConfig();
          const state = {
            activities: [{ id: 'a' }]
          };
          config.activity.api.getActivities = () => Promise.resolve(state.activities);
          config.activity.api.getActivities.operation = 'READ';

          const spy = sinon.spy();
          const api = build(config, [plugin()]);
          const observable = api.activity.getActivities.createObservable();

          // fill the cache so that we can remove items later
          api.user.getUsers().then(() => {
            observable.subscribe(spy);

            return delay().then(() => {
              expect(spy).to.have.been.calledOnce;

              const firstArgs = spy.args[0];
              expect(firstArgs.length).to.equal(1);

              state.activities = [...state.activities, { id: 'b' }];

              return api.mediumUser.removeUser('peter').then(() => {
                return delay().then(() => {
                  expect(spy).to.have.been.calledThrice;
                  const secondArgs = spy.args[1];
                  expect(secondArgs[0].length).to.equal(2);
                });
              });
            });
          });
        });
      });

      it('makes sure identical observables are not needlessly fired in parallel', () => {
        const apiSpy = sinon.spy();

        const config = {
          user: {
            api: {
              getUsers: () => { apiSpy(); return Promise.resolve([]); },
              createUser: () => Promise.resolve({ id: 'x' })
            }
          }
        };
        config.user.api.getUsers.operation = 'READ';
        config.user.api.createUser.operation = 'CREATE';
        const api = build(config, [plugin()]);
        const observable1 = api.user.getUsers.createObservable();
        const observable2 = api.user.getUsers.createObservable();

        observable1.subscribe(() => {});
        observable2.subscribe(() => {});

        return delay().then(() => {
          expect(apiSpy).to.have.been.calledOnce;

          return api.user.createUser().then(() => {
            return delay().then(() => {
              expect(apiSpy).to.have.been.calledOnce;
            });
          });
        });
      });
    });
  });
});
