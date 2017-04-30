/* eslint-disable no-unused-expressions */

import sinon from 'sinon';
import {curry} from 'ladda-fp';
import {build} from './builder';

const users = [{ id: 1 }, { id: 2 }];
const getUsers = () => Promise.resolve(users);
getUsers.operation = 'READ';

const deleteUser = () => Promise.resolve();
deleteUser.operation = 'DELETE';

const config = () => ({
  user: {
    ttl: 300,
    api: {
      getUsers,
      deleteUser
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
  it('Adds notifiers to APIs', () => {
    const myConfig = config();
    myConfig.user.api.getUsers = sinon.spy(myConfig.user.api.getUsers);
    const api = build(myConfig);
    expect(api.user._notifyCreate).to.not.be.undefined;
    expect(api.user._notifyRead).to.not.be.undefined;
    expect(api.user._notifyUpdate).to.not.be.undefined;
    expect(api.user._notifyDelete).to.not.be.undefined;
  });
  it('Adds notifiers to APIs even if no API is specified', () => {
    const myConfig = config();
    myConfig.user.api.getUsers = sinon.spy(myConfig.user.api.getUsers);
    const api = build(myConfig);
    delete api.user.api;
    expect(api.user._notifyCreate).to.not.be.undefined;
    expect(api.user._notifyRead).to.not.be.undefined;
    expect(api.user._notifyUpdate).to.not.be.undefined;
    expect(api.user._notifyDelete).to.not.be.undefined;
  });
  it('Notifiers are just identity functions lifted to promises', (done) => {
    const myConfig = config();
    myConfig.user.api.getUsers = sinon.spy(myConfig.user.api.getUsers);
    const api = build(myConfig);
    api.user._notifyCreate('hello').then((value) => {
      expect(value).to.be.equal('hello');
      done();
    });
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
        pluginTracker[pName][fn.name] = true;
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

  describe('change listener', () => {
    it('exposes Ladda\'s listener/onChange interface to plugins', () => {
      const plugin = ({ addChangeListener }) => {
        expect(addChangeListener).to.be;
        return ({ fn }) => fn;
      };

      build(config(), [plugin]);
    });

    it('allows plugins to add a listener, which gets notified on all cache changes', () => {
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
        expect(changeObject.type).to.equal('UPDATE');
        expect(changeObject.entities).to.deep.equal(users);
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

    it('works without global config', () => {
      const conf = config();
      delete conf.__config;
      const api = build(conf);
      expect(api).to.be.defined;
    });
  });
});
