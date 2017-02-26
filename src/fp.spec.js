import {curry} from './fp';

describe('fp', () => {
    describe('curry', () => {
        it('builds stuff', () => {
            const fn = (x, y, z) => console.log(x, y, z);
            const fisk = curry(fn)('foo', 'fisk');
        });
    });
});
