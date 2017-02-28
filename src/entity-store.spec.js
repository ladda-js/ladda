import {createEntityStore, put, get, contains} from './entity-store';

const config = [
    {
        name: 'user',
        ttl: 300,
        api: {
            getUsers: (x) => x,
            deleteUser: (x) => x,
        },
        invalidates: ['alles']
    },
    {
        name: 'userPreview',
        ttl: 200,
        api: {
            getPreviews: (x) => x,
            updatePreview: (x) => x,
        },
        invalidates: ['fda'],
        viewOf: 'user'
    },
    {
        name: 'listUser',
        ttl: 200,
        api: {
            getPreviews: (x) => x,
            updatePreview: (x) => x,
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
    });
    describe('put', () => {
        it('an added value is later returned when calling get', () => {
            const s = createEntityStore(config);
            const v = {id: 'hello'};
            const e = { name: 'user'};
            put(s, e, v);
            const r = get(s, e, v.id);
            expect(r.value).to.equal(v);
        });
        it('an added value to a view is later returned when calling get for view', () => {
            const s = createEntityStore(config);
            const v = {id: 'hello'};
            const e = { name: 'user'};
            put(s, e, v);
            const r = get(s, e, v.id);
            expect(r.value).to.equal(v);
        });
    });
    describe('get', () => {
        it('gets value with timestamp', () => {
            const s = createEntityStore(config);
            const v = {id: 'hello'};
            const e = { name: 'user'};
            put(s, e, v);
            const r = get(s, e, v.id);
            expect(r.timestamp).to.not.be.undefined;
        });
        it('gets undefined if value does not exist', () => {
            const s = createEntityStore(config);
            const v = {id: 'hello'};
            const e = { name: 'user'};
            const r = get(s, e, v.id);
            expect(r).to.be.undefined;
        });
    });
    describe('contains', () => {
        it('true if value exist', () => {
            const s = createEntityStore(config);
            const v = {id: 'hello'};
            const e = { name: 'user'};
            put(s, e, v);
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
});
