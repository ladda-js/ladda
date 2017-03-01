import {decorate} from './index';
import {createEntityStore} from 'entity-store';
import {createQueryCache, put, contains} from 'query-cache';

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
            triggerCarValueCalculation: (x) => Promise.resolve([x])
        },
        invalidates: ['user'],
        invalidatesOn: ['NO_OPERATION']
    }
];


describe('Decorate', () => {
    it('returns decorated function if no operation specified', () => {
        const f = (x) => x;
        const entity = {api: {getAll: f}};
        const res = decorate(null, null, entity);
        expect(res.api.getAll).not.to.equal(f);
    });
    it('decorated function invalidates if NO_OPERATION is configured', (done) => {
        const aFn = () => Promise.resolve('hej');
        const xOrg = [{id: 1, name: 'Kalle'}];
        const es = createEntityStore(config);
        const qc = createQueryCache(es);
        const eUser = config[0];
        const eCar = config[1];
        const carsApi = decorate(es, qc, eCar, aFn);
        put(qc, eUser, aFn, [1], xOrg);

        expect(contains(qc, eUser, aFn, [1])).to.be.true;
        const shouldHaveRemovedUser = () => {
            expect(contains(qc, eUser, aFn, [1])).to.be.false;
            done();
        };
        carsApi.api.triggerCarValueCalculation(xOrg).then(shouldHaveRemovedUser);
    });
});
