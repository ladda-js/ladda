import {createEntityStore} from './entity-store';
import {createQueryCache, query, invalidate} from './query-cache';
import sinon from 'sinon';

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

describe('QueryCache', () => {
    describe('createQueryCache', () => {
        it('Returns an object', () => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            expect(qc).to.be.a('object');
        });
    });

    describe('query', () => {
        it('If not in cache, call aFn', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            query(qc, e, aFn, [1, 2, 3]).then((x) => {
                expect(aFn.called).to.be.true;
                done();
            });
        });
        it('If in cache, do not call aFn', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            const firstCall = query(qc, e, aFn, [1, 2, 3]);

            firstCall.then(() => {
                query(qc, e, aFn, [1, 2, 3]).then((x) => {
                    expect(aFn.callCount).to.equal(1);
                    done();
                });
            });
        });
        it('If in cache but expired, do call aFn', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = {...config[0], ttl: -1};
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            const firstCall = query(qc, e, aFn, [1, 2, 3]);

            firstCall.then(() => {
                query(qc, e, aFn, [1, 2, 3]).then((x) => {
                    expect(aFn.callCount).to.equal(2);
                    done();
                });
            });
        });
        it('return value from aFn', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });

            query(qc, e, aFn, [1, 2, 3]).then((x) => {
                expect(x).to.equal(xOrg);
                done();
            });
        });
        it('return value from aFn when just one', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = {id: 1, name: 'Kalle'};
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });

            query(qc, e, aFn, [1, 2, 3]).then((x) => {
                expect(x).to.equal(xOrg);
                done();
            }).catch((x) => console.log(x));
        });

        it('return value from aFn when just one and using cache', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = {id: 1, name: 'Kalle'};
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });

            const firstCall = query(qc, e, aFn, [1, 2, 3]);
            firstCall.then(() => {
                query(qc, e, aFn, [1, 2, 3]).then((x) => {
                    expect(x).to.equal(xOrg);
                    expect(aFn.callCount).to.be.equal(1);
                    done();
                }).catch((x) => console.log(x));
            });
        });
    });
    describe('invalidate', () => {
        it('calls aFn for invalidated entity', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            aFn.operation = 'READ';
            const firstCall = query(qc, e, aFn, [1, 2, 3]);

            firstCall.then(() => {
                invalidate(qc, e, aFn);
                query(qc, e, aFn, [1, 2, 3]).then((x) => {
                    expect(aFn.callCount).to.equal(2);
                    done();
                });
            });
        });
        it('does not call aFn for invalidated entity if operation not in invalidatesOn', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            const firstCall = query(qc, e, aFn, [1, 2, 3]);

            firstCall.then(() => {
                invalidate(qc, e, aFn, 'POST');
                query(qc, e, aFn, [1, 2, 3]).then((x) => {
                    expect(aFn.callCount).to.equal(1);
                    done();
                });
            });
        });
        it('does invalidate specific query if configured', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });

            const getUsers2 = sinon.spy(function foo() {
                return Promise.resolve(xOrg);
            });

            aFn.invalidates = [getUsers2.name];

            const firstCall = query(qc, e, getUsers2, [1, 2, 3]);

            firstCall.then(() => {
                invalidate(qc, e, aFn, 'POST');
                query(qc, e, getUsers2, [1, 2, 3]).then((x) => {
                    expect(getUsers2.callCount).to.equal(2);
                    done();
                });
            });
        });
        it('does not invalidate query if not configured', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });

            const getUsers2 = sinon.spy(function foo() {
                return Promise.resolve(xOrg);
            });

            aFn.invalidates = ['fdsa'];

            const firstCall = query(qc, e, getUsers2, [1, 2, 3]);

            firstCall.then(() => {
                invalidate(qc, e, aFn, 'POST');
                query(qc, e, getUsers2, [1, 2, 3]).then((x) => {
                    expect(getUsers2.callCount).to.equal(1);
                    done();
                });
            });
        });
    });
});
