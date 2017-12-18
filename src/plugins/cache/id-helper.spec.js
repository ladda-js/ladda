import {addId, removeId, EMPTY_ARGS_PLACEHOLDER} from './id-helper';

describe('IdHelper', () => {
  it('removeId is the inverse of addId', () => {
    const o = {id: 1};
    expect(removeId(addId({}, undefined, undefined, o))).to.deep.equal(o);
  });
  it('addId creates id from args if idFrom is ARGS', () => {
    const o = {name: 'kalle'};
    const aFn = {idFrom: 'ARGS'};
    expect(addId({}, aFn, [1, 2, 3], o)).to.deep.equal(
      {...o, __ladda__id: '1-2-3'}
    );
  });
  it('addId handles empty args if idFrom is ARGS', () => {
    const o = {name: 'kalle'};
    const aFn = {idFrom: 'ARGS'};
    expect(addId({}, aFn, [], o)).to.deep.equal(
      {...o, __ladda__id: EMPTY_ARGS_PLACEHOLDER}
    );
  });
  it('removing id from undefined returns undefined', () => {
    const o = undefined;
    expect(removeId(o)).to.equal(o);
  });
  it('removing id from array remove it from individual elements', () => {
    const o = [{__ladda__id: 1, id: 1}, {__ladda__id: 2, id: 2}, {__ladda__id: 3, id: 3}];
    expect(removeId(o)).to.deep.equal([{id: 1}, {id: 2}, {id: 3}]);
  });
  it('addId can use a custom function', () => {
    const o = {myId: 15};
    const aFn = {idFrom: x => x.myId};
    const res = addId({}, aFn, [1, 2, 3], o);
    expect(res).to.deep.equal({...o, __ladda__id: 15});
  });
});
