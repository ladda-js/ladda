import { createDatastore,
         createItem,
         getItem,
         replaceTempId } from './datastore';
import { createQuery } from './query';

describe('Datastore', () => {
    describe('createItem', () => {

        it('An unique temporary id is generated', () => {
            const datastore = createDatastore({});
            const query = createQuery('type', 'value');
            const itemOneId = createItem(datastore, query, 'value', 'promise');
            const itemTwoId = createItem(datastore, query, 'value', 'promise');
            expect(itemOneId).to.not.equal(itemTwoId);
        });

        it('A created id can be retrieved', (done) => {
            const datastore = createDatastore({});
            const query = createQuery('user');
            const itemOneId = createItem(datastore, query, 'value', 'promise');
            const itemRetrieved = getItem(datastore, createQuery('user', itemOneId));
            itemRetrieved.then((item) => {
                expect(item).to.be.equal('value');
                done();
            });
        });

    });

    describe('replaceTempId', () => {

        it('Makes it possible to query for item with new id', (done) => {
            const datastore = createDatastore({ user: 500 });
            const promiseWithNewId = Promise.resolve('newId');
            const query = createQuery('user');
            const itemOneId = createItem(datastore, query, 'value', promiseWithNewId);
            const queryForItem = createQuery('user', itemOneId);

            replaceTempId(datastore, queryForItem, 'newId');

            const itemRetrieved = getItem(datastore, createQuery('user', 'newId'));
            itemRetrieved.then((item) => {
                expect(item).to.be.equal('value');
                done();
            });
        });

        it('Keeps the possibility to query for item using temporary id', (done) => {
            const datastore = createDatastore({ user: 500 });
            const promiseWithNewId = Promise.resolve('newId');
            const query = createQuery('user');
            const itemOneId = createItem(datastore, query, 'value', promiseWithNewId);
            const queryForItem = createQuery('user', itemOneId);

            replaceTempId(datastore, queryForItem, 'newId');

            const itemRetrieved = getItem(datastore, createQuery('user', itemOneId));
            itemRetrieved.then((item) => {
                expect(item).to.be.equal('value');
                done();
            });
        });

    });
});
