import {merge} from './merger';

describe('Merger', () => {
  it('overwrites stuff in dest', () => {
    const src = {a: 'hej'};
    const dest = {a: 'hello'};
    const res = merge(src, dest);
    expect(res.a).to.equal('hej');
  });
  it('do not write anything that does not exist in destination object', () => {
    const src = {a: 'hej'};
    const dest = {};
    const res = merge(src, dest);
    expect(res).to.deep.equal(dest);
  });
  it('merge objects in the objects', () => {
    const src = {a: {b: {c: 'hello'}}};
    const dest = {a: {b: {c: 'hej'}}};
    const res = merge(src, dest);
    expect(res.a.b.c).to.equal('hello');
  });
  it('do not merge objects in the objects of destination lack object', () => {
    const src = {a: {b: {c: 'hello'}}};
    const dest = {a: {b: {e: 'hej'}}};
    const res = merge(src, dest);
    expect(Object.keys(res.a.b)).to.not.deep.equal(['c']);
  });
  it('do not write anything that does not exist in destination object (object)', () => {
    const src = {a: {foo: 'bar'}};
    const dest = {};
    const res = merge(src, dest);
    expect(res).to.deep.equal(dest);
  });
});
