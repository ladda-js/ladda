import {build} from './builder';
import sinon from 'sinon';

const getUsers = () => Promise.resolve([{id: 1}, {id: 2}]);
getUsers.operation = 'READ';

const deleteUser = () => Promise.resolve();
deleteUser.operation = 'DELETE';

const config = () => ({
    user: {
        ttl: 300,
        api: {
            getUsers,
            deleteUser
        },
        invalidates: ['alles']
    }
});

describe('builder', () => {
    it('Builds the API', () => {
        const api = build(config());
        expect(api).to.be.ok;
    });
    it('Two read api calls will only require one api request to be made', (done) => {
        const myConfig = config();
        myConfig.user.api.getUsers = sinon.spy(myConfig.user.api.getUsers);
        const api = build(myConfig);

        const expectOnlyOneApiCall = () => {
            expect(myConfig.user.api.getUsers.callCount).to.equal(1);
            done();
        };

        Promise.resolve()
               .then(() => api.user.getUsers())
               .then(() => api.user.getUsers())
               .then(expectOnlyOneApiCall);
    });
    it('Two read api calls will return the same output', (done) => {
        const myConfig = config();
        myConfig.user.api.getUsers = sinon.spy(myConfig.user.api.getUsers);
        const api = build(myConfig);

        const expectOnlyOneApiCall = (xs) => {
            expect(xs).to.be.deep.equal([{id: 1}, {id: 2}]);
            done();
        };

        Promise.resolve()
               .then(() => api.user.getUsers())
               .then(() => api.user.getUsers())
               .then(expectOnlyOneApiCall);
    });
    it('Works with non default id set', (done) => {
        const myConfig = config();
        myConfig.__config = {idField: 'mySecretId'};
        myConfig.user.api.getUsers = sinon.spy(() =>
            Promise.resolve([{mySecretId: 1}, {mySecretId: 2}]));
        myConfig.user.api.getUsers.operation = 'READ';
        const api = build(myConfig);
        const expectOnlyOneApiCall = (xs) => {
            expect(myConfig.user.api.getUsers.callCount).to.equal(1);
            expect(xs).to.be.deep.equal([{mySecretId: 1}, {mySecretId: 2}]);
            done();
        };

        Promise.resolve()
               .then(() => api.user.getUsers())
               .then(() => api.user.getUsers())
               .then(expectOnlyOneApiCall);
    });
});
