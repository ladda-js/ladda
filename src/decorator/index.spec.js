import {decorate} from './index';
import {createEntityStore} from 'entity-store';
import {createQueryCache, put, contains} from 'query-cache';
import {addId} from 'id-helper';
import {createApiFunction} from 'test-helper';

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
        name: 'cars',
        ttl: 200,
        api: {
            triggerCarValueCalculation: createApiFunction((x) => Promise.resolve([x]))
        },
        invalidates: ['user'],
        invalidatesOn: ['NO_OPERATION']
    }
];


describe('Decorate', () => {
    it('decorated function invalidates if NO_OPERATION is configured', (done) => {
        const aFn = createApiFunction(() => Promise.resolve('hej'));
        const xOrg = [{id: 1, name: 'Kalle'}];
        const es = createEntityStore(config);
        const qc = createQueryCache(es);
        const eUser = config[0];
        const eCar = config[1];
        const carsApi = decorate({}, es, qc, eCar, aFn);
        put(qc, eUser, aFn, [1], addId({}, undefined, undefined, xOrg));

        expect(contains(qc, eUser, aFn, [1])).to.be.true;
        const shouldHaveRemovedUser = () => {
            expect(contains(qc, eUser, aFn, [1])).to.be.false;
            done();
        };
        carsApi.api.triggerCarValueCalculation(xOrg).then(shouldHaveRemovedUser);
    });
});
