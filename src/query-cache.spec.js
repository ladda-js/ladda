import {createEntityStore} from './entity-store';
import {createQueryCache, getValue, put, contains, get, invalidate} from './query-cache';

const config = [
    {
        name: 'user',
        ttl: 300,
        api: {
            getUsers: (x) => x,
            getUsers2: (x) => x,
            deleteUser: (x) => x,
        },
        invalidates: ['user'],
        invalidatesOn: ['READ']
    },
    {
        name: 'userPreview',
        ttl: 200,
        api: {
            getPreviews: (x) => x,
            updatePreview: (x) => x,
        },
        invalidates: ['fds'],
        viewOf: 'user'
    },
    {
        name: 'cars',
        ttl: 200,
        api: {
            getCars: (x) => x,
            updateCar: (x) => x,
        },
        invalidates: ['user'],
        viewOf: 'user'
    },
    {
        name: 'bikes',
        ttl: 200,
        api: {
            getCars: (x) => x,
            updateCar: (x) => x,
        }
    }
];

describe('QueryCache', () => {
    describe('createQueryCache', () => {
        it('Returns an object', () => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            expect(qc).to.be.a('object');
        });
    });
    describe('getValue', () => {
        it('extracts values from an array of cache values and returns these', () => {
            const expected = [[1, 2, 3], [4, 5, 6]];
            const data = [{value: [1, 2, 3]}, {value: [4, 5, 6]}];
            expect(getValue(data)).to.deep.equal(expected);
        });
        it('extracts values from a cache value and returns it', () => {
            const expected = [1, 2, 3];
            const data = {value: [1, 2, 3]};
            expect(getValue(data)).to.deep.equal(expected);
        });
    });
    describe('contains & put', () => {
        it('if an element exist, return true', () => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const aFn = (x) => x;
            const args = [1, 2, 3];
            const xs = [{id: 1}, {id: 2}, {id: 3}];
            put(qc, e, aFn, args, xs);
            expect(contains(qc, e, aFn, args)).to.be.true;
        });
        it('if an element exist, and args contains a complex object, return true', () => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const aFn = (x) => x;
            const args = [1, {hello: {world: 'Kalle'}}, 3];
            const xs = [{id: 1}, {id: 2}, {id: 3}];
            put(qc, e, aFn, args, xs);
            expect(contains(qc, e, aFn, args)).to.be.true;
        });
        it('if an element exist, and args contains a simple object, return true', () => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const aFn = (x) => x;
            const args = [1, {hello: 'world'}, 3];
            const xs = [{id: 1}, {id: 2}, {id: 3}];
            put(qc, e, aFn, args, xs);
            expect(contains(qc, e, aFn, args)).to.be.true;
        });
        it('if an element does not exist, return false', () => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const aFn = (x) => x;
            const args = [1, 2, 3];
            expect(contains(qc, e, aFn, args)).to.be.false;
        });
    });
    describe('get', () => {
        it('if an element exist, return it', () => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const aFn = (x) => x;
            const args = [1, 2, 3];
            const xs = [{id: 1}, {id: 2}, {id: 3}];
            put(qc, e, aFn, args, xs);
            expect(getValue(get(qc, e, aFn, args).value)).to.deep.equal(xs);
        });
        it('if an does not exist, throw an error', () => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const aFn = (x) => x;
            const args = [1, 2, 3];
            const fnUnderTest = () => getValue(get(qc, e, aFn, args).value);
            expect(fnUnderTest).to.throw(Error);
        });
    });
    describe('invalidate', () => {
        it('invalidates other cache as specified', () => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const eUser = config[0];
            const eCars = config[2];
            const aFn = (x) => x;
            aFn.operation = 'CREATE';
            const args = [1, 2, 3];
            const xs = [{id: 1}, {id: 2}, {id: 3}];
            put(qc, eUser, aFn, args, xs);
            invalidate(qc, eCars, aFn);
            const hasUser = contains(qc, eUser, aFn, args);
            expect(hasUser).to.be.false;
        });
        it('does not crash when no invalidates specified', () => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const eBikes = config[3];
            const aFn = (x) => x;
            aFn.operation = 'CREATE';
            const fn = () => invalidate(qc, eBikes, aFn);
            expect(fn).to.not.throw();
        });
    });
});
