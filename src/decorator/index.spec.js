import {decorate} from './index';

describe('Decorate', () => {
    it('returns the api fn if no operation specified', () => {
        const f = (x) => x;
        const entity = {api: {getAll: f}};
        const res = decorate(null, null, entity);
        expect(res.api.getAll).to.equal(f);
    });
});
