import {decorateUpdate} from './update';
import {createEntityStore, get} from 'entity-store';
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

describe('Update', () => {
    describe('decorateUpdate', () => {
        it('Updates cache based on argument', (done) => {
            const es = createEntityStore(config);
            const qc = createQueryCache(es);
            const e = config[0];
            const xOrg = {id: 1, name: 'Kalle'};
            const aFn = sinon.spy(() => {
                return Promise.resolve({});
            });

            const res = decorateUpdate({}, es, qc, e, aFn);
            res(xOrg).then(() => {
                expect(get(es, e, 1).value).to.deep.equal({...xOrg, __ladda__id: 1});
                done();
            });
        });
    });
});
