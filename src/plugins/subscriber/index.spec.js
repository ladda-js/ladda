/* eslint-disable no-unused-expressions */

import sinon from 'sinon';

import { build } from '../../builder';
import { toIdMap, values } from '../../fp';
import { subscriber as plugin } from '.';

const createConfig = () => {
  const peter = { id: 'peter', name: 'peter' };
  const gernot = { id: 'gernot', name: 'gernot' };
  const robin = { id: 'robin', name: 'robin' };

  const users = toIdMap([peter, gernot, robin]);

  const getUser = (id) => Promise.resolve(users[id]);
  getUser.operation = 'READ';
  getUser.byId = true;
  const getUsers = () => Promise.resolve(values(users));
  getUser.operation = 'READ';

  const updateUser = (nextUser) => {
    const { id } = nextUser;
    const user = users[id];
    users[id] = { ...user, ...nextUser };
    return Promise.resolve(users[id]);
  };
  updateUser.operaton = 'UPDATE';

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


describe('subscriber', () => {
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
});
