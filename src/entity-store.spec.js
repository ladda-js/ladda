/* eslint-disable no-unused-expressions */

import sinon from 'sinon';
import {createEntityStore, put, mPut, get, contains, remove} from './entity-store';
import {addId} from './id-helper';

const config = [
  {
    name: 'user',
    ttl: 300,
    api: {
      getUsers: (x) => x,
      deleteUser: (x) => x
    },
    invalidates: ['alles']
  },
  {
    name: 'userPreview',
    ttl: 200,
    api: {
      getPreviews: (x) => x,
      updatePreview: (x) => x
    },
    invalidates: ['fda'],
    viewOf: 'user'
  },
  {
    name: 'listUser',
    ttl: 200,
    api: {
      getPreviews: (x) => x,
      updatePreview: (x) => x
    },
    invalidates: ['fda'],
    viewOf: 'user'
  }
];

describe('EntityStore', () => {
  describe('createEntityStore', () => {
    it('returns store', () => {
      const s = createEntityStore(config);
      expect(s).to.be.ok;
    });
    it('returns store', () => {
      const myConfig = [
        {
          name: 'userPreview',
          viewOf: 'user'
        },
        {
          name: 'user'
        }
      ];
      const s = createEntityStore(myConfig);
      expect(s).to.be.ok;
    });
  });
  describe('put', () => {
    it('an added value is later returned when calling get', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = { name: 'user'};
      put(s, e, addId({}, undefined, undefined, v));
      const r = get(s, e, v.id);
      expect(r.value).to.deep.equal({...v, __ladda__id: 'hello'});
    });
    it('altering an added value does not alter the stored value when doing a get later', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello', name: 'kalle'};
      const e = { name: 'user'};
      put(s, e, addId({}, undefined, undefined, v));
      v.name = 'ingvar';
      const r = get(s, e, v.id);
      expect(r.value.name).to.equal('kalle');
    });
    it('an added value to a view is later returned when calling get for view', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = { name: 'user'};
      put(s, e, addId({}, undefined, undefined, v));
      const r = get(s, e, v.id);
      expect(r.value).to.deep.equal({...v, __ladda__id: 'hello'});
    });
    it('merges view into entity value', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = {name: 'user'};
      const eView = {name: 'userPreview', viewOf: 'user'};
      put(s, e, addId({}, undefined, undefined, {...v, name: 'kalle'}));
      put(s, eView, addId({}, undefined, undefined, {...v, name: 'ingvar'}));
      const r = get(s, eView, v.id);
      expect(r.value).to.be.deep.equal({__ladda__id: 'hello', id: 'hello', name: 'ingvar'});
    });
    it('writing view value without id throws error', () => {
      const s = createEntityStore(config);
      const v = {aid: 'hello'};
      const eView = {name: 'userPreview', viewOf: 'user'};
      const write = () => put(s, eView, addId({}, undefined, undefined, {...v, name: 'kalle'}));
      expect(write).to.throw(Error);
    });
    it('writing entitiy value without id throws error', () => {
      const s = createEntityStore(config);
      const v = {aid: 'hello'};
      const e = {name: 'user'};
      const write = () => put(s, e, addId({}, undefined, undefined, {...v, name: 'kalle'}));
      expect(write).to.throw(Error);
    });
  });

  describe('mPut', () => {
    it('adds values which are later returned when calling get', () => {
      const s = createEntityStore(config);
      const v1 = {id: 'hello'};
      const v2 = {id: 'there'};
      const e = { name: 'user'};
      const v1WithId = addId({}, undefined, undefined, v1);
      const v2WithId = addId({}, undefined, undefined, v2);
      mPut(s, e, [v1WithId, v2WithId]);
      const r1 = get(s, e, v1.id);
      const r2 = get(s, e, v2.id);
      expect(r1.value).to.deep.equal({...v1, __ladda__id: 'hello'});
      expect(r2.value).to.deep.equal({...v2, __ladda__id: 'there'});
    });
  });
  describe('get', () => {
    it('gets value with timestamp', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = { name: 'user'};
      put(s, e, addId({}, undefined, undefined, v));
      const r = get(s, e, v.id);
      expect(r.timestamp).to.not.be.undefined;
    });
    it('altering retrieved value does not alter the stored value', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello', name: 'kalle'};
      const e = { name: 'user'};
      put(s, e, addId({}, undefined, undefined, v));
      const r = get(s, e, v.id);
      r.value.name = 'ingvar';
      const r2 = get(s, e, v.id);
      expect(r2.value.name).to.equal(v.name);
    });
    it('gets undefined if value does not exist', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = { name: 'user'};
      const r = get(s, e, v.id);
      expect(r).to.be.undefined;
    });
    it('gets undefined for view if not existing', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = {name: 'userPreview', viewOf: 'user'};
      const r = get(s, e, v.id);
      expect(r).to.be.undefined;
    });
    it('gets entity of view if only it exist', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = {name: 'user'};
      put(s, e, addId({}, undefined, undefined, v));
      const eView = {name: 'userPreview', viewOf: 'user'};
      const r = get(s, eView, v.id);
      expect(r.value).to.be.deep.equal({...v, __ladda__id: 'hello'});
    });
    it('gets view if only it exist', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const eView = {name: 'userPreview', viewOf: 'user'};
      put(s, eView, addId({}, undefined, undefined, v));
      const r = get(s, eView, v.id);
      expect(r.value).to.be.deep.equal({...v, __ladda__id: 'hello'});
    });
    it('gets entity value if same timestamp as view value', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = {name: 'user'};
      const eView = {name: 'userPreview', viewOf: 'user'};
      put(s, eView, addId({}, undefined, undefined, v));
      put(s, e, addId({}, undefined, undefined, {...v, name: 'kalle'}));
      const r = get(s, eView, v.id);
      expect(r.value).to.be.deep.equal({...v, name: 'kalle', __ladda__id: 'hello'});
    });
    it('gets entity value if newer than view value', (done) => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = {name: 'user'};
      const eView = {name: 'userPreview', viewOf: 'user'};
      put(s, eView, addId({}, undefined, undefined, v));
      setTimeout(() => {
        put(s, e, addId({}, undefined, undefined, {...v, name: 'kalle'}));
        const r = get(s, eView, v.id);
        expect(r.value).to.be.deep.equal({...v, name: 'kalle', __ladda__id: 'hello'});
        done();
      }, 1);
    });
  });
  describe('contains', () => {
    it('true if value exist', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = { name: 'user'};
      put(s, e, addId({}, undefined, undefined, v));
      const r = contains(s, e, v.id);
      expect(r).to.be.true;
    });
    it('false if no value exist', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = { name: 'user'};
      const r = contains(s, e, v.id);
      expect(r).to.be.false;
    });
  });
  describe('remove', () => {
    it('removes an existing value', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = { name: 'user'};
      put(s, e, addId({}, undefined, undefined, v));
      remove(s, e, v.id);
      const r = contains(s, e, v.id);
      expect(r).to.be.false;
    });
    it('does not crash when removing not existing value', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = { name: 'user'};
      const fn = () => remove(s, e, v.id);
      expect(fn).to.not.throw();
    });
  });

  describe('with a hook', () => {
    describe('put', () => {
      it('notifies with the put entity as singleton list', () => {
        const hook = sinon.spy();
        const s = createEntityStore(config, hook);
        const v = {id: 'hello'};
        const e = { name: 'user'};
        put(s, e, addId({}, undefined, undefined, v));
        expect(hook).to.have.been.called;

        expect(hook).to.have.been.calledWith({
          type: 'UPDATE',
          entity: 'user',
          entities: [v]
        });
      });
    });

    describe('mPut', () => {
      it('notifies with the put entities', () => {
        const hook = sinon.spy();
        const s = createEntityStore(config, hook);
        const v1 = {id: 'hello'};
        const v2 = {id: 'there'};
        const e = { name: 'user'};
        const v1WithId = addId({}, undefined, undefined, v1);
        const v2WithId = addId({}, undefined, undefined, v2);
        mPut(s, e, [v1WithId, v2WithId]);

        expect(hook).to.have.been.called;

        const arg = hook.args[0][0];
        expect(arg.type).to.equal('UPDATE');
        expect(arg.entities).to.deep.equal([v1, v2]);
      });
    });

    describe('rm', () => {
      it('notifies with the removed entity as a singleton list', () => {
        const hook = sinon.spy();
        const s = createEntityStore(config, hook);
        const v = {id: 'hello'};
        const e = { name: 'user'};
        put(s, e, addId({}, undefined, undefined, v));
        remove(s, e, v.id);

        expect(hook).to.have.been.calledTwice; // we also put!

        const arg = hook.args[1][0];
        expect(arg.type).to.equal('DELETE');
        expect(arg.entities).to.deep.equal([v]);
      });
    });
  });
});
