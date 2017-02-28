import {createEntityStore, put, get, contains, remove} from './entity-store';

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
        it('merges view into entity value', () => {
            const s = createEntityStore(config);
            const v = {id: 'hello'};
            const e = {name: 'user'};
            const eView = {name: 'userPreview', viewOf: 'user'};
            put(s, e, {...v, name: 'kalle'});
            put(s, eView, {...v, name: 'ingvar'});
            const r = get(s, eView, v.id);
            expect(r.value).to.be.deep.equal({id: 'hello', name: 'ingvar'});
        });
        it('writing view value without id throws error', () => {
            const s = createEntityStore(config);
            const v = {aid: 'hello'};
            const eView = {name: 'userPreview', viewOf: 'user'};
            const write = () => put(s, eView, {...v, name: 'kalle'});
            expect(write).to.throw(Error);
        });
        it('writing entitiy value without id throws error', () => {
            const s = createEntityStore(config);
            const v = {aid: 'hello'};
            const e = {name: 'user'};
            const write = () => put(s, e, {...v, name: 'kalle'});
            expect(write).to.throw(Error);
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
            put(s, e, v);
            const eView = {name: 'userPreview', viewOf: 'user'};
            const r = get(s, eView, v.id);
            expect(r.value).to.be.deep.equal(v);
        });
        it('gets view if only it exist', () => {
            const s = createEntityStore(config);
            const v = {id: 'hello'};
            const e = {name: 'user'};
            const eView = {name: 'userPreview', viewOf: 'user'};
            put(s, eView, v);
            const r = get(s, eView, v.id);
            expect(r.value).to.be.deep.equal(v);
        });
        it('gets entity value if same timestamp as view value', () => {
            const s = createEntityStore(config);
            const v = {id: 'hello'};
            const e = {name: 'user'};
            const eView = {name: 'userPreview', viewOf: 'user'};
            put(s, eView, v);
            put(s, e, {...v, name: 'kalle'});
            const r = get(s, eView, v.id);
            expect(r.value).to.be.deep.equal({...v, name: 'kalle'});
        });
        it('gets entity value if newer than view value', (done) => {
            const s = createEntityStore(config);
            const v = {id: 'hello'};
            const e = {name: 'user'};
            const eView = {name: 'userPreview', viewOf: 'user'};
            put(s, eView, v);
            setTimeout(() => {
                put(s, e, {...v, name: 'kalle'});
                const r = get(s, eView, v.id);
                expect(r.value).to.be.deep.equal({...v, name: 'kalle'});
                done();
            }, 1);
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
    describe('remove', () => {
        it('removes an existing value', () => {
            const s = createEntityStore(config);
            const v = {id: 'hello'};
            const e = { name: 'user'};
            put(s, e, v);
            remove(s, e, v.id);
            const r = contains(s, e, v.id);
            expect(r).to.be.false;
        });
    });
});
