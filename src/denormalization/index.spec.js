import { build } from '../builder';
import { denormalizer } from '.';
import { curry, prop, toObject, values } from '../fp';

const toIdMap = toObject(prop('id'));

const peter = { id: 'peter' };
const gernot = { id: 'gernot' };

const users = toIdMap([peter, gernot]);

const m1 = { id: 'x', author: peter.id, recipient: gernot.id };
const m2 = { id: 'y', author: gernot.id, recipient: peter.id };

const messages = toIdMap([m1, m2]);

const getById = curry((m, id) => Promise.resolve(m[id]));
const getAll = (m) => () => Promise.resolve(values(m));

const getUser = getById(users);
getUser.operation = 'READ';
getUser.byId = true;
const getUsers = getAll(users);
getUser.operation = 'READ';

const getMessage = getById(messages);
getMessage.operation = 'READ';
getMessage.byId = true;
const getMessages = getAll(messages);
getMessages.operation = 'READ';


const config = () => ({
  user: {
    api: { getUser, getUsers },
    plugins: {
      denormalizer: {
        getOne: 'getUser',
        getAll: 'getUsers',
        threshold: 5
      }
    }
  },
  message: {
    api: { getMessage, getMessages },
    plugins: {
      denormalizer: {
        schema: {
          author: 'user',
          recipient: 'user'
        }
      }
    }
  }
});

const expectResolved = curry((k, val, obj) => {
  expect(obj[k]).to.deep.equal(val);
  return obj;
});

describe('with a fn, that returns one object', () => {
  it('resolves all references', (done) => {
    const api = build(config(), [denormalizer()]);
    api.message.getMessage(m1.id)
      .then(expectResolved('author', users[m1.author]))
      .then(expectResolved('recipient', users[m1.recipient]))
      .then(() => done());
  });
});
