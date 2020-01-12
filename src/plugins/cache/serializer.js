const EMPTY_STRING = '__EMPTY_STRING__';

export const serialize = (x) => {
  if (x instanceof Date) {
    return x.toISOString();
  }
  if (x === '') {
    return EMPTY_STRING;
  }
  if (x instanceof Object) {
    return Object.keys(x).map(k => serialize(x[k])).join('-');
  }
  return x;
};
