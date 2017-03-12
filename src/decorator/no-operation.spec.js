import {decorateNoOperation} from './no-operation';
import {createEntityStore} from 'entity-store';
import {createQueryCache, contains, put} from 'query-cache';
import sinon from 'sinon';
import {createSampleConfig, createApiFunction} from 'test-helper';

const config = createSampleConfig();

describe('DecorateNoOperation', () => {
    it('Invalidates based on what is specified in the original function', (done) => {
        const es = createEntityStore(config);
        const qc = createQueryCache(es);
        const e = config[0];
        const xOrg = {__ladda__id: 1, name: 'Kalle'};
        const aFn = sinon.spy(() => {
            return Promise.resolve({});
        });
        const getUsers = () => Promise.resolve(xOrg);
        aFn.invalidates = ['getUsers'];
        put(qc, e, getUsers, ['args'], xOrg);
        const res = decorateNoOperation({}, es, qc, e, aFn);
        res(xOrg).then(() => {
            const killedCache = !contains(qc, e, getUsers, ['args']);
            expect(killedCache).to.be.true;
            done();
        });
    });
    it('Does not change original function', () => {
        const es = createEntityStore(config);
        const qc = createQueryCache(es);
        const e = config[0];
        const aFn = sinon.spy(() => {
            return Promise.resolve({});
        });
        decorateNoOperation({}, es, qc, e, aFn);
        expect(aFn.operation).to.be.undefined;
    });
    it('Ignored inherited invalidation config', (done) => {
        const es = createEntityStore(config);
        const qc = createQueryCache(es);
        const e = config[0];
        const xOrg = {__ladda__id: 1, name: 'Kalle'};
        const aFnWithoutSpy = createApiFunction(() => Promise.resolve({}), {invalidates: ['user']});
        const aFn = sinon.spy(aFnWithoutSpy);
        const getUsers = createApiFunction(() => Promise.resolve(xOrg));
        aFn.hasOwnProperty = () => false;
        put(qc, e, getUsers, ['args'], xOrg);
        const res = decorateNoOperation({}, es, qc, e, aFn);
        res(xOrg).then(() => {
            const killedCache = !contains(qc, e, getUsers, ['args']);
            expect(killedCache).to.be.false;
            done();
        }).catch(e => console.log(e));
    });
});
