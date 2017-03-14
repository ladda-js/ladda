/* eslint-disable no-unused-expressions */

import sinon from 'sinon';

import { build } from '../../builder';
import { curry, prop, head, last, toObject, values } from '../../fp';
import { denormalizer, extractAccessors } from '.';

const toIdMap = toObject(prop('id'));

const peter = { id: 'peter' };
const gernot = { id: 'gernot' };
const robin = { id: 'robin' };

const users = toIdMap([peter, gernot, robin]);

const c1 = { id: 'a' };
const c2 = { id: 'b' };

const comments = toIdMap([c1, c2]);

const m1 = {
  id: 'x',
  author: peter.id,
  recipient: gernot.id,
  visibleTo: [robin.id],
  nestedData: {
    comments: [c1.id, c2.id]
  }
};
const m2 = {
  id: 'y',
  author: gernot.id,
  recipient: peter.id,
  visibleTo: [],
  nestedData: {
    comments: []
  }
};

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

const getComment = getById(comments);
getComment.operation = 'READ';
getComment.byId = true;
const getComments = getAll(comments);
getComments.operation = 'READ';


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
          recipient: 'user',
          visibleTo: ['user'],
          nestedData: {
            comments: ['comment']
          }
        }
      }
    }
  },
  comment: {
    api: { getComment, getComments },
    plugins: {
      denormalizer: {
        getOne: 'getComment',
        getAll: 'getComments'
      }
    }
  }
});

const expectResolved = curry((k, val, obj) => {
  expect(obj[k]).to.deep.equal(val);
  return obj;
});

describe('denormalizer', () => {
  describe('with a fn, that returns one object', () => {
    it('resolves references to simple id fields', (done) => {
      const api = build(config(), [denormalizer()]);
      api.message.getMessage(m1.id)
        .then(expectResolved('author', users[m1.author]))
        .then(expectResolved('recipient', users[m1.recipient]))
        .then(() => done());
    });

    it('resolves references to lists of ids', (done) => {
      const api = build(config(), [denormalizer()]);
      api.message.getMessage(m1.id)
        .then(expectResolved('visibleTo', [users[m1.visibleTo[0]]]))
        .then(() => done());
    });

    it('resolves references for nested data', (done) => {
      const api = build(config(), [denormalizer()]);
      api.message.getMessage(m1.id)
        .then((m) => expectResolved('comments', [c1, c2], m.nestedData))
        .then(() => done());
    });

    it('fails immediately when no config for an entity present in a schema is defined', () => {
      const conf = {
        user: {
          api: {}
        },
        message: {
          api: {},
          plugins: {
            denormalizer: {
              schema: {
                author: 'user'
              }
            }
          }
        }
      };

      const start = () => build(conf, [denormalizer()]);
      expect(start).to.throw(/no.*config.*user/i);
    });

    it('fails immediately when config for an entity present in a schema is incomplete', () => {
      const conf = {
        user: {
          api: {},
          plugins: {
            denormalizer: {}
          }
        },
        message: {
          api: {},
          plugins: {
            denormalizer: {
              schema: {
                author: 'user'
              }
            }
          }
        }
      };

      const start = () => build(conf, [denormalizer()]);
      expect(start).to.throw(/no.*getOne.*user/i);
    });

    it('calls getOne when there is only one entity to resolve', () => {
      const getOneSpy = sinon.spy(() => Promise.resolve({ id: 'a' }));
      const getSomeSpy = sinon.spy(() => Promise.resolve());
      const authorId = 'x';

      const conf = {
        user: {
          api: {
            getOne: getOneSpy,
            getSome: getSomeSpy
          },
          plugins: {
            denormalizer: {
              getOne: 'getOne',
              getSome: 'getSome'
            }
          }
        },
        message: {
          api: {
            get: () => Promise.resolve({ authors: [authorId] })
          },
          plugins: {
            denormalizer: {
              schema: {
                authors: ['user']
              }
            }
          }
        }
      };

      const api = build(conf, [denormalizer()]);
      return api.message.get().then(() => {
        expect(getOneSpy).to.have.been.calledOnce;
        expect(getOneSpy).to.have.been.calledWith(authorId);
        expect(getSomeSpy).not.to.have.been.called;
      });
    });

    it('calls getAll when multiple items requested is above threshold', () => {
      const getOneSpy = sinon.spy(() => Promise.resolve({ id: 'a' }));
      const getSomeSpy = sinon.spy(() => Promise.resolve([]));
      const getAllSpy = sinon.spy(() => Promise.resolve([]));

      const conf = {
        user: {
          api: {
            getOne: getOneSpy,
            getSome: getSomeSpy,
            getAll: getAllSpy
          },
          plugins: {
            denormalizer: {
              getOne: 'getOne',
              getSome: 'getSome',
              getAll: 'getAll',
              threshold: 2
            }
          }
        },
        message: {
          api: {
            get: () => Promise.resolve({ authors: ['a', 'b', 'c']})
          },
          plugins: {
            denormalizer: {
              schema: {
                authors: ['user']
              }
            }
          }
        }
      };

      const api = build(conf, [denormalizer()]);
      return api.message.get().then(() => {
        expect(getSomeSpy).not.to.have.been.called;
        expect(getAllSpy).to.have.been.calledOnce;
      });
    });

    it('calls getSome when multiple items requested are below threshold', () => {
      const getOneSpy = sinon.spy(() => Promise.resolve({ id: 'a' }));
      const getSomeSpy = sinon.spy(() => Promise.resolve([]));
      const getAllSpy = sinon.spy(() => Promise.resolve([]));

      const conf = {
        user: {
          api: {
            getOne: getOneSpy,
            getSome: getSomeSpy,
            getAll: getAllSpy
          },
          plugins: {
            denormalizer: {
              getOne: 'getOne',
              getSome: 'getSome',
              getAll: 'getAll',
              threshold: 3
            }
          }
        },
        message: {
          api: {
            get: () => Promise.resolve({ authors: ['a', 'b']})
          },
          plugins: {
            denormalizer: {
              schema: {
                authors: ['user']
              }
            }
          }
        }
      };

      const api = build(conf, [denormalizer()]);
      return api.message.get().then(() => {
        expect(getSomeSpy).to.have.been.called;
        expect(getSomeSpy).to.have.been.calledWith(['a', 'b']);
        expect(getAllSpy).not.to.have.been.calledOnce;
      });
    });

    it('calls getSome when multiple items requested are at threshold', () => {
      const getOneSpy = sinon.spy(() => Promise.resolve({ id: 'a' }));
      const getSomeSpy = sinon.spy(() => Promise.resolve([]));
      const getAllSpy = sinon.spy(() => Promise.resolve([]));

      const conf = {
        user: {
          api: {
            getOne: getOneSpy,
            getSome: getSomeSpy,
            getAll: getAllSpy
          },
          plugins: {
            denormalizer: {
              getOne: 'getOne',
              getSome: 'getSome',
              getAll: 'getAll',
              threshold: 2
            }
          }
        },
        message: {
          api: {
            get: () => Promise.resolve({ authors: ['a', 'b']})
          },
          plugins: {
            denormalizer: {
              schema: {
                authors: ['user']
              }
            }
          }
        }
      };

      const api = build(conf, [denormalizer()]);
      return api.message.get().then(() => {
        expect(getSomeSpy).to.have.been.called;
        expect(getAllSpy).not.to.have.been.calledOnce;
      });
    });

    it('calls getSome when items requested are above threshold, but no getAll present', () => {
      const getOneSpy = sinon.spy(() => Promise.resolve({ id: 'a' }));
      const getSomeSpy = sinon.spy(() => Promise.resolve([]));

      const conf = {
        user: {
          api: {
            getOne: getOneSpy,
            getSome: getSomeSpy
          },
          plugins: {
            denormalizer: {
              getOne: 'getOne',
              getSome: 'getSome',
              threshold: 1
            }
          }
        },
        message: {
          api: {
            get: () => Promise.resolve({ authors: ['a', 'b']})
          },
          plugins: {
            denormalizer: {
              schema: {
                authors: ['user']
              }
            }
          }
        }
      };

      const api = build(conf, [denormalizer()]);
      return api.message.get().then(() => {
        expect(getSomeSpy).to.have.been.called;
        expect(getSomeSpy).to.have.been.calledWith(['a', 'b']);
      });
    });

    it('calls getOne several times when there is nothing else defined', () => {
      const getOneSpy = sinon.spy(() => Promise.resolve({ id: 'a' }));

      const conf = {
        user: {
          api: {
            getOne: getOneSpy
          },
          plugins: {
            denormalizer: {
              getOne: 'getOne'
            }
          }
        },
        message: {
          api: {
            get: () => Promise.resolve({ authors: ['a', 'b']})
          },
          plugins: {
            denormalizer: {
              schema: {
                authors: ['user']
              }
            }
          }
        }
      };

      const api = build(conf, [denormalizer()]);
      return api.message.get().then(() => {
        expect(getOneSpy).to.have.been.calledTwice;
        expect(getOneSpy).to.have.been.calledWith('a');
        expect(getOneSpy).to.have.been.calledWith('b');
      });
    });

    it('allows to define a global threshold', () => {
      const getOneSpy = sinon.spy(() => Promise.resolve({ id: 'a' }));
      const getSomeSpy = sinon.spy(() => Promise.resolve([]));
      const getAllSpy = sinon.spy(() => Promise.resolve([]));

      const conf = {
        user: {
          api: {
            getOne: getOneSpy,
            getSome: getSomeSpy,
            getAll: getAllSpy
          },
          plugins: {
            denormalizer: {
              getOne: 'getOne',
              getSome: 'getSome',
              getAll: 'getAll'
            }
          }
        },
        message: {
          api: {
            get: () => Promise.resolve({ authors: ['a', 'b', 'c']})
          },
          plugins: {
            denormalizer: {
              schema: {
                authors: ['user']
              }
            }
          }
        }
      };

      const api = build(conf, [denormalizer({ threshold: 2 })]);
      return api.message.get().then(() => {
        expect(getSomeSpy).not.to.have.been.called;
        expect(getAllSpy).to.have.been.calledOnce;
      });
    });

    it('does not fall when entities are unused and have no conf defined', () => {
      const conf = {
        user: {
          api: {
            getOne: () => Promise.resolve()
          },
          plugins: {
            denormalizer: {
              getOne: 'getOne'
            }
          }
        },
        message: {
          api: {
            get: () => Promise.resolve({ authors: ['a', 'b', 'c']})
          },
          plugins: {
            denormalizer: {
              schema: {
                authors: ['user']
              }
            }
          }
        },
        comment: {
          api: {
            get: () => Promise.resolve()
          }
        }
      };

      const start = () => build(conf, [denormalizer()]);
      expect(start).not.to.throw;
    });
  });

  describe('with a fn, that returns a list of objects', () => {
    it('resolves references to simple id fields', (done) => {
      const api = build(config(), [denormalizer()]);
      api.message.getMessages()
        .then((msgs) => {
          const fst = head(msgs);
          const snd = last(msgs);
          expectResolved('author', users[m1.author])(fst);
          expectResolved('recipient', users[m1.recipient])(fst);

          expectResolved('author', users[m2.author])(snd);
          expectResolved('recipient', users[m2.recipient])(snd);
        })
        .then(() => done());
    });
  });
});

describe('denormalization-helpers', () => {
  const createConfig = () => [
    {
      name: 'message',
      plugins: {
        denormalizer: {
          schema: {
            author: 'user',
            recipient: 'user',
            visibleTo: ['user'],
            nestedData: {
              comments: ['comment']
            }
          }
        }
      }
    },
    {
      name: 'review',
      plugins: {
        denormalizer: {
          schema: {
            author: 'user',
            meta: {
              data: {
                comments: ['comment']
              }
            }
          }
        }
      }
    }
  ];

  describe('extractAccessors', () => {
    it('parses config and returns all paths to entities defined in schemas', () => {
      const expected = {
        message: [
          [['author'], 'user'],
          [['recipient'], 'user'],
          [['visibleTo'], ['user']],
          [['nestedData', 'comments'], ['comment']]
        ],
        review: [
          [['author'], 'user'],
          [['meta', 'data', 'comments'], ['comment']]
        ]
      };

      const actual = extractAccessors(createConfig());
      expect(actual).to.deep.equal(expected);
    });
  });
});

