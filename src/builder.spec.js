/* eslint-disable no-unused-expressions */

import sinon from 'sinon';
import {curry, toIdMap} from 'ladda-fp';
import {build} from './builder';

const users = [{ id: 1 }, { id: 2 }];
const usersMap = toIdMap(users);

const getUser = (id) => Promise.resolve(usersMap[id]);
getUser.operation = 'READ';

const getUsers = () => Promise.resolve(users);
getUsers.operation = 'READ';

const deleteUser = (id) => Promise.resolve(usersMap[id]);
deleteUser.operation = 'DELETE';

const noopUser = () => Promise.resolve(['a', 'b']);
noopUser.operation = 'NO_OPERATION';

const config = () => ({
  user: {
    ttl: 300,
    api: {
      getUser,
      getUsers,
      deleteUser,
      noopUser
    },
    invalidates: ['alles']
  },
  __config: {
    useProductionBuild: true
  }
});

describe('builder', () => {
  it('Builds the API', () => {
    const api = build(config());
    expect(api).to.be.ok;
  });
  it('Two read api calls will only require one api request to be made', (done) => {
    const myConfig = config();
    myConfig.user.api.getUsers = sinon.spy(myConfig.user.api.getUsers);
    const api = build(myConfig);

    const expectOnlyOneApiCall = () => {
      expect(myConfig.user.api.getUsers.callCount).to.equal(1);
      done();
    };

    Promise.resolve()
      .then(() => api.user.getUsers())
      .then(() => api.user.getUsers())
      .then(expectOnlyOneApiCall);
  });

  it('Two read api calls will return the same output', (done) => {
    const myConfig = config();
    myConfig.user.api.getUsers = sinon.spy(myConfig.user.api.getUsers);
    const api = build(myConfig);

    const expectOnlyOneApiCall = (xs) => {
      expect(xs).to.be.deep.equal([{id: 1}, {id: 2}]);
      done();
    };

    Promise.resolve()
      .then(() => api.user.getUsers())
      .then(() => api.user.getUsers())
      .then(expectOnlyOneApiCall);
  });

  it('1000 calls is not slow', (done) => {
    const myConfig = config();
    myConfig.user.api.getUsers = sinon.spy(myConfig.user.api.getUsers);
    myConfig.user.api.getUsers.idFrom = 'ARGS';
    const api = build(myConfig);
    const start = Date.now();
    const checkTimeConstraint = () => {
      expect(Date.now() - start < 1000).to.be.true;
      done();
    };

    let bc = Promise.resolve();
    for (let i = 0; i < 1000; i++) {
      bc = bc.then(() => api.user.getUsers('wei'));
    }
    bc.then(checkTimeConstraint);
  });

  it('Works with non default id set', (done) => {
    const myConfig = config();
    myConfig.__config = {idField: 'mySecretId', useProductionBuild: true};
    myConfig.user.api.getUsers = sinon.spy(
      () => Promise.resolve([{mySecretId: 1}, {mySecretId: 2}])
    );
    myConfig.user.api.getUsers.operation = 'READ';
    const api = build(myConfig);
    const expectOnlyOneApiCall = (xs) => {
      expect(myConfig.user.api.getUsers.callCount).to.equal(1);
      expect(xs).to.be.deep.equal([{mySecretId: 1}, {mySecretId: 2}]);
      done();
    };

    Promise.resolve()
      .then(() => api.user.getUsers())
      .then(() => api.user.getUsers())
      .then(expectOnlyOneApiCall);
  });

  it('Delete removes value from cached array', (done) => {
    const myConfig = config();
    myConfig.user.api.getUsers = sinon.spy(() => Promise.resolve([{id: 1}, {id: 2}]));
    myConfig.user.api.getUsers.operation = 'READ';
    const api = build(myConfig);
    const expectUserToBeRemoved = (xs) => {
      expect(xs).to.be.deep.equal([{id: 2}]);
      done();
    };

    Promise.resolve()
      .then(() => api.user.getUsers())
      .then(() => api.user.deleteUser('1'))
      .then(() => api.user.getUsers())
      .then(expectUserToBeRemoved);
  });

  describe('after deletion', () => {
    it('calls the apiFn again when marked as byId === true', () => {
      const myConfig = config();
      const spy = sinon.spy();

      const getUserById = () => {
        spy();
        return Promise.resolve({ id: 4 });
      };
      getUserById.operation = 'READ';
      getUserById.byId = true;

      myConfig.user.api.getUserById = getUserById;

      const api = build(myConfig);

      return Promise.resolve()
        .then(() => api.user.getUserById('1'))
        .then(() => api.user.deleteUser('1'))
        .then(() => api.user.getUserById('1'))
        .then(() => {
          expect(spy).to.have.been.calledTwice;
        });
    });

    it('returns null for normal read operation when entity is requested again', () => {
      const myConfig = config();

      const api = build(myConfig);

      return Promise.resolve()
        .then(() => api.user.getUser('1'))
        .then(() => api.user.deleteUser('1'))
        .then(() => api.user.getUser('1'))
        .then((user) => {
          expect(user).to.be.null;
        });
    });
  });


  it('TTL set to zero means we never get a cache hit', (done) => {
    const myConfig = config();
    myConfig.user.ttl = 0;
    myConfig.user.api.getUsers = sinon.spy(myConfig.user.api.getUsers);
    const api = build(myConfig);

    const expectOnlyOneApiCall = () => {
      expect(myConfig.user.api.getUsers.callCount).to.equal(2);
      done();
    };

    const delay = () => new Promise(res => setTimeout(() => res(), 1));

    Promise.resolve()
      .then(() => api.user.getUsers())
      .then(delay)
      .then(() => api.user.getUsers())
      .then(expectOnlyOneApiCall);
  });

  it('takes plugins as second argument', (done) => {
    const myConfig = config();
    const pluginTracker = {};
    const plugin = (pConfig) => {
      const pName = pConfig.name;
      pluginTracker[pName] = {};
      return curry(({ config: c, entityConfigs }, { fn }) => {
        pluginTracker[pName][fn.fnName] = true;
        return fn;
      });
    };
    const pluginName = 'X';
    const expectACall = () => expect(pluginTracker[pluginName].getUsers).to.be.true;

    const api = build(myConfig, [plugin({ name: pluginName })]);
    api.user.getUsers()
      .then(expectACall)
      .then(() => done());
  });

  it('applies dedup before and after the plugins, if there are any', () => {
    const getAll = sinon.stub().returns(Promise.resolve([]));
    getAll.operation = 'READ';
    const conf = { test: { api: { getAll } } };
    const plugin = () => ({ fn }) => () => {
      fn();
      fn();
      return fn();
    };
    const api = build(conf, [plugin]);
    api.test.getAll();
    api.test.getAll();
    return api.test.getAll().then(() => {
      expect(getAll).to.have.been.calledOnce;
    });
  });

  describe('change listener', () => {
    it('exposes Ladda\'s listener/onChange interface to plugins', () => {
      const plugin = ({ addChangeListener }) => {
        expect(addChangeListener).to.be;
        return ({ fn }) => fn;
      };

      build(config(), [plugin]);
    });

    it('returns a deregistration fn', () => {
      const spy = sinon.spy();

      const plugin = ({ addChangeListener }) => {
        const deregister = addChangeListener(spy);
        deregister();
        return ({ fn }) => fn;
      };

      const api = build(config(), [plugin]);

      return api.user.getUsers().then(() => {
        expect(spy).not.to.have.been.called;
      });
    });

    it('can call deregistration fn several times without harm', () => {
      const spy = sinon.spy();

      const plugin = ({ addChangeListener }) => {
        const deregister = addChangeListener(spy);
        deregister();
        deregister();
        deregister();
        return ({ fn }) => fn;
      };

      const api = build(config(), [plugin]);

      return api.user.getUsers().then(() => {
        expect(spy).not.to.have.been.called;
      });
    });

    describe('allows plugins to add a listener, which gets notified on all cache changes', () => {
      it('on READ operations', () => {
        const spy = sinon.spy();

        const plugin = ({ addChangeListener }) => {
          addChangeListener(spy);
          return ({ fn }) => fn;
        };

        const api = build(config(), [plugin]);

        return api.user.getUsers().then(() => {
          expect(spy).to.have.been.calledOnce;
          const changeObject = spy.args[0][0];
          expect(changeObject.entity).to.equal('user');
          expect(changeObject.apiFn).to.equal('getUsers');
          expect(changeObject.operation).to.equal('READ');
          expect(changeObject.values).to.deep.equal(users);
          expect(changeObject.args).to.deep.equal([]);
        });
      });

      it('on NO_OPERATION operations', () => {
        const spy = sinon.spy();

        const plugin = ({ addChangeListener }) => {
          addChangeListener(spy);
          return ({ fn }) => fn;
        };

        const api = build(config(), [plugin]);

        return api.user.noopUser('x').then(() => {
          expect(spy).to.have.been.calledOnce;
          const changeObject = spy.args[0][0];
          expect(changeObject.entity).to.equal('user');
          expect(changeObject.apiFn).to.equal('noopUser');
          expect(changeObject.operation).to.equal('NO_OPERATION');
          expect(changeObject.values).to.deep.equal(null);
          expect(changeObject.args).to.deep.equal(['x']);
        });
      });

      it('on DELETE operations', () => {
        const spy = sinon.spy();

        const plugin = ({ addChangeListener }) => {
          addChangeListener(spy);
          return ({ fn }) => fn;
        };

        const api = build(config(), [plugin]);

        // fill the cache with users so that we can delete something
        return api.user.getUsers().then(() => {
          spy.reset();
          return api.user.deleteUser('1').then(() => {
            expect(spy).to.have.been.calledOnce;
            const changeObject = spy.args[0][0];
            expect(changeObject.entity).to.equal('user');
            expect(changeObject.apiFn).to.equal('deleteUser');
            expect(changeObject.operation).to.equal('DELETE');
            expect(changeObject.values).to.deep.equal([{ id: 1 }]);
            expect(changeObject.args).to.deep.equal(['1']);
          });
        });
      });
    });

    it('does not trigger when a pure cache hit is made', () => {
      const spy = sinon.spy();

      const plugin = ({ addChangeListener }) => {
        addChangeListener(spy);
        return ({ fn }) => fn;
      };

      const api = build(config(), [plugin]);

      return api.user.getUsers().then(() => {
        expect(spy).to.have.been.calledOnce;

        return api.user.getUsers().then(() => {
          expect(spy).to.have.been.calledOnce;
        });
      });
    });

    it('returns a deregistration function to remove the listener', () => {
      const spy = sinon.spy();

      const plugin = ({ addChangeListener }) => {
        const deregister = addChangeListener(spy);
        deregister();
        return ({ fn }) => fn;
      };

      const api = build(config(), [plugin]);

      return api.user.getUsers().then(() => {
        expect(spy).not.to.have.been.called;
      });
    });
  });

  describe('updateOnCreate', () => {
    it('allows to define a hook, which updates the query cache on create', () => {
      const xs = [{ id: 1 }, { id: 2 }];

      const createX = (newX) => Promise.resolve(newX);
      createX.operation = 'CREATE';

      const getXs = () => Promise.resolve(xs);
      getXs.operation = 'READ';
      getXs.updateOnCreate = (args, newX, cachedXs) => [...cachedXs, newX];

      const api = build({ x: { api: { getXs, createX } } });

      return api.x.getXs().then((cachedXs) => {
        expect(cachedXs).to.deep.equal(xs);

        return api.x.createX({ id: 3 }).then((nextX) => {
          return api.x.getXs().then((nextXs) => {
            expect(nextXs).to.deep.equal([...xs, nextX]);
          });
        });
      });
    });

    it('makes sure that updateOnCreate hook is applied only when needed', () => {
      // we're testing here whether our detection on where to apply a create event
      // actually works. We had a bug here, where a create event was applied twice,
      // when several updateOnCreate fns where defined, on api functions, where
      // the name of one was a substring of another (like getList and getList2)
      const xs = [{ id: 1 }, { id: 2 }];

      const createX = (newX) => Promise.resolve(newX);
      createX.operation = 'CREATE';

      const getList = () => Promise.resolve(xs);
      getList.operation = 'READ';
      getList.updateOnCreate = (args, newX, cachedXs) => [...cachedXs, newX];

      // eslint-disable-next-line no-unused-vars
      const getList2 = (someArg) => Promise.resolve(xs);
      getList2.operation = 'READ';
      getList2.updateOnCreate = (args, newX, cachedXs) => [...cachedXs, newX];

      const getList3 = () => Promise.resolve(xs);
      getList3.operation = 'READ';
      getList3.updateOnCreate = (args, newX, cachedXs) => [...cachedXs, newX];

      const api = build({ x: { api: { getList, getList2, getList3, createX } } });
      return api.x.getList2('x').then(() => {
        return api.x.getList3().then(() => {
          return api.x.createX({ id: 3 }).then((nextX) => {
            return api.x.getList2('x').then((nextXs) => {
              expect(nextXs).to.deep.equal([...xs, nextX]);
              return api.x.getList3().then((otherNextXs) => {
                expect(otherNextXs).to.deep.equal([...xs, nextX]);
              });
            });
          });
        });
      });
    });

    it('can decide how to update based on prior arguments', () => {
      const xs = [{ id: 1 }, { id: 2 }];

      const createX = (newX) => Promise.resolve(newX);
      createX.operation = 'CREATE';

      const getXs = () => Promise.resolve(xs);
      getXs.operation = 'READ';
      getXs.updateOnCreate = (args, newX, cachedXs) => {
        return args[0] ? [newX, ...cachedXs] : [...cachedXs, newX];
      };

      const api = build({ x: { api: { getXs, createX } } });

      return Promise.all([
        api.x.getXs(true),
        api.x.getXs(false)
      ]).then(() => {
        return api.x.createX({ id: 3 }).then((nextX) => {
          return Promise.all([
            api.x.getXs(true),
            api.x.getXs(false)
          ]).then(([prepended, appended]) => {
            expect(prepended).to.deep.equal([nextX, ...xs]);
            expect(appended).to.deep.equal([...xs, nextX]);
          });
        });
      });
    });

    it('can decide not to update anything', () => {
      const xs = [{ id: 1 }, { id: 2 }];

      const createX = (newX) => Promise.resolve(newX);
      createX.operation = 'CREATE';

      const getXs = () => Promise.resolve(xs);
      getXs.operation = 'READ';
      getXs.updateOnCreate = () => {};

      const api = build({ x: { api: { getXs, createX } } });

      return api.x.getXs().then((cachedXs) => {
        expect(cachedXs).to.deep.equal(xs);

        return api.x.createX({ id: 3 }).then(() => {
          return api.x.getXs().then((nextXs) => {
            expect(nextXs).to.deep.equal(xs);
          });
        });
      });
    });

    it('works fine when created element is removed before we try to access the list again', () => {
      const xs = [{ id: 1 }, { id: 2 }];

      const createX = (newX) => Promise.resolve(newX);
      createX.operation = 'CREATE';

      const getXs = () => Promise.resolve(xs);
      getXs.operation = 'READ';
      getXs.updateOnCreate = (args, newX, cachedXs) => [...cachedXs, newX];

      const deleteX = () => Promise.resolve();
      deleteX.operation = 'DELETE';

      const api = build({ x: { api: { getXs, createX, deleteX } } });

      return api.x.getXs().then((cachedXs) => {
        expect(cachedXs).to.deep.equal(xs);

        return api.x.createX({ id: 3 }).then(() => {
          return api.x.deleteX(3).then(() => {
            return api.x.getXs().then((nextXs) => {
              expect(nextXs).to.deep.equal(xs);
            });
          });
        });
      });
    });
  });

  describe('idFrom ARGS', () => {
    const getX = (a, b) => {
      if (a === '' && b === '') {
        return Promise.resolve({ x: 'xxx' });
      }
      return Promise.resolve({ x: 'x' });
    };
    getX.operation = 'READ';
    getX.idFrom = 'ARGS';

    const idFromArgsConfig = () => ({
      x: {
        ttl: 300,
        api: { getX }
      },
      __config: {
        useProductionBuild: true
      }
    });

    it('works when return value has no id and args are present', () => {
      const c = idFromArgsConfig();
      const api = build(c);

      return api.x.getX('some', 'random', false, 'args').then((x) => {
        expect(x.x).to.equal('x'); // we basically just wanna know it doesn't throw
      });
    });

    it('works when return value has no id and NO args are present', () => {
      const c = idFromArgsConfig();
      const api = build(c);

      return api.x.getX().then((x) => {
        expect(x.x).to.equal('x'); // we basically just wanna know it doesn't throw
      });
    });

    it('deals properly with empty strings', () => {
      const c = idFromArgsConfig();
      const api = build(c);

      return api.x.getX('').then((x) => {
        expect(x.x).to.equal('x');
        return api.x.getX('', '').then((secondX) => {
          expect(secondX.x).to.equal('xxx');
        });
      });
    });
  });
});

