/* eslint-disable no-unused-expressions */

import {createEntityStore, put, mPut, get, contains, remove} from './entity-store';
import {addId, withId} from './id-helper';

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
      expect(r.value).to.deep.equal(withId('hello', v));
    });
    it('an added value to a view is later returned when calling get for view', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = { name: 'user'};
      put(s, e, addId({}, undefined, undefined, v));
      const r = get(s, e, v.id);
      expect(r.value).to.deep.equal(withId('hello', v));
    });
    it('merges view into entity value', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = {name: 'user'};
      const eView = {name: 'userPreview', viewOf: 'user'};
      put(s, e, addId({}, undefined, undefined, {...v, name: 'kalle'}));
      put(s, eView, addId({}, undefined, undefined, {...v, name: 'ingvar'}));
      const r = get(s, eView, v.id);
      expect(r.value).to.be.deep.equal(withId('hello', { id: 'hello', name: 'ingvar' }));
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
      expect(r1.value).to.deep.equal(withId('hello', v1));
      expect(r2.value).to.deep.equal(withId('there', v2));
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
    xit('altering retrieved value does not alter the stored value', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello', name: 'kalle'};
      const e = { name: 'user'};
      put(s, e, addId({}, undefined, undefined, v));
      const r = get(s, e, v.id);
      r.value.name = 'ingvar';
      const r2 = get(s, e, v.id);
      expect(r2.value.item.name).to.equal(v.name);
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
      expect(r.value).to.be.deep.equal(withId('hello', v));
    });
    it('gets view if only it exist', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const eView = {name: 'userPreview', viewOf: 'user'};
      put(s, eView, addId({}, undefined, undefined, v));
      const r = get(s, eView, v.id);
      expect(r.value).to.be.deep.equal(withId('hello', v));
    });
    it('gets entity value if same timestamp as view value', () => {
      const s = createEntityStore(config);
      const v = {id: 'hello'};
      const e = {name: 'user'};
      const eView = {name: 'userPreview', viewOf: 'user'};
      put(s, eView, addId({}, undefined, undefined, v));
      put(s, e, addId({}, undefined, undefined, {...v, name: 'kalle'}));
      const r = get(s, eView, v.id);
      expect(r.value).to.be.deep.equal(withId('hello', {...v, name: 'kalle' }));
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
        expect(r.value).to.be.deep.equal(withId('hello', {...v, name: 'kalle' }));
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
});
