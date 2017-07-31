/* eslint-disable no-unused-expressions */

import sinon from 'sinon';
import {curry} from 'ladda-fp';
import {build} from './builder';

const users = [{ id: 1 }, { id: 2 }];
const getUsers = () => Promise.resolve(users);
getUsers.operation = 'READ';

const deleteUser = () => Promise.resolve();
deleteUser.operation = 'DELETE';

const noopUser = () => Promise.resolve(['a', 'b']);
noopUser.operation = 'NO_OPERATION';

const config = () => ({
  user: {
    ttl: 300,
    api: {
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
      .then(() => api.user.deleteUser(1))
      .then(() => api.user.getUsers())
      .then(expectUserToBeRemoved);
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
});
