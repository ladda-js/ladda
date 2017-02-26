import {build} from './builder';

const config = {
    user: {
        ttl: 300,
        api: {
            getUsers: (x) => x,
            deleteUser: (x) => x,
        },
        invalidates: ['alles']
    },
    userPreview: {
        ttl: 200,
        api: {
            getPreviews: (x) => x,
            updatePreview: (x) => x,
        },
        invalidates: ['fda'],
        viewOf: 'user'
    }
};
config.user.api.getUsers.operation = 'READ';
config.user.api.getUsers.plural = true;
config.user.api.deleteUser.operation = 'DELETE';
config.userPreview.api.getPreviews.operation = 'READ';
config.userPreview.api.getPreviews.plural = true;
config.userPreview.api.updatePreview.operation = 'UPDATE';

describe('builder', () => {
    it('builds stuff', () => {
        const api = build(config);
        expect(api).to.not.equal(null);
    });
});
