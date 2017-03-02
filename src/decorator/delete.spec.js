import {decorateDelete} from './delete';
import {createEntityStore, get, put} from 'entity-store';
import {createQueryCache} from 'query-cache';
import {addId} from 'id-helper';
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

describe('Delete', () => {
    describe('decorateDelete', () => {
        it('Removes cache', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = {id: 1, name: 'Kalle'};
            const aFn = sinon.spy(() => {
                return Promise.resolve({});
            });
            put(es, e, addId(undefined, undefined, xOrg));
            const res = decorateDelete(es, qc, e, aFn);
            res(1).then(() => {
                expect(get(es, e, 1)).to.equal(undefined);
                done();
            });
        });
    });
});
