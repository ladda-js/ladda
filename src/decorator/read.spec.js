import {decorateRead} from './read';
import {createEntityStore} from 'entity-store';
import {createQueryCache} from 'query-cache';
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
        invalidatesOn: ['GET']
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

describe('Read', () => {
    describe('decorateRead', () => {
        it('calls api fn if not in cache with byId set', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = {id: 1, name: 'Kalle'};
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            aFn.byId = true;
            const res = decorateRead(es, qc, e, aFn);
            res(1).then(() => {
                expect(aFn.callCount).to.equal(1);
                done();
            });
        });
        it('does not call api fn if in cache with byId set', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = {id: 1, name: 'Kalle'};
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            aFn.byId = true;
            const res = decorateRead(es, qc, e, aFn);
            res(1).then(res.bind(null, 1)).then(() => {
                expect(aFn.callCount).to.equal(1);
                done();
            });
        });
        it('calls api fn if not in cache', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = {id: 1, name: 'Kalle'};
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            const res = decorateRead(es, qc, e, aFn);
            res(1).then(() => {
                expect(aFn.callCount).to.equal(1);
                done();
            });
        });
        it('does not call api fn if in cache', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = {id: 1, name: 'Kalle'};
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            const res = decorateRead(es, qc, e, aFn);

            const firstCall = res(1);

            firstCall.then(() => {
                res(1).then(() => {
                    expect(aFn.callCount).to.equal(1);
                    done();
                });
            });
        });
        it('does call api fn if in cache but expired', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = {...config[0], ttl: -1};
            const xOrg = {id: 1, name: 'Kalle'};
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            const res = decorateRead(es, qc, e, aFn);

            const firstCall = res(1);

            firstCall.then(() => {
                res(1).then(() => {
                    expect(aFn.callCount).to.equal(2);
                    done();
                });
            });
        });
        it('calls api fn if not in cache (plural)', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            const res = decorateRead(es, qc, e, aFn);
            res(1).then((x) => {
                expect(x).to.equal(xOrg);
                done();
            });
        });
        it('does not call api fn if in cache (plural)', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            const res = decorateRead(es, qc, e, aFn);

            const firstCall = res(1);

            firstCall.then(() => {
                res(1).then(() => {
                    expect(aFn.callCount).to.equal(1);
                    done();
                });
            });
        });
        it('does call api fn if in cache but expired (plural)', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = {...config[0], ttl: -1};
            const xOrg = [{id: 1, name: 'Kalle'}];
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            const res = decorateRead(es, qc, e, aFn);

            const firstCall = res(1);

            firstCall.then(() => {
                res(1).then(() => {
                    expect(aFn.callCount).to.equal(2);
                    done();
                });
            });
        });
        it('throws if id is missing', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = {...config[0], ttl: 300};
            const xOrg = {name: 'Kalle'};
            const aFn = sinon.spy(() => {
                return Promise.resolve(xOrg);
            });
            const res = decorateRead(es, qc, e, aFn);

            res().catch(e => {
                expect(e).to.be.a('Error');
                done();
            });

        });
    });
});
