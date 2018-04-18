import {serialize} from './serializer';

describe('Serializer', () => {
  it('serializes string to itself', () => {
    const res = serialize('hello');
    expect(res).to.equal('hello');
  });
  it('serializes date to iso string', () => {
    const d = new Date('2018-04-18T08:55:54.974Z');
    const res = serialize(d);
    expect(res).to.equal('2018-04-18T08:55:54.974Z');
  });
  it('serializes object by taking its values and joining with -', () => {
    const res = serialize({a: 'hello', b: 'world'});
    expect(res).to.equal('hello-world');
  });
  it('serializes objects recursively by taking its values and joining with -', () => {
    const res = serialize({a: 'hello', b: {c: 'world', d: '!'}});
    expect(res).to.equal('hello-world-!');
  });
  it('int serialize to int', () => {
    const res = serialize(1);
    expect(res).to.equal(1);
  });
  it('falsy returns itself', () => {
    const res = serialize(null);
    expect(res).to.equal(null);
  });
});
