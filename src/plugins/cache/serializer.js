const EMPTY_STRING = '__EMPTY_STRING__';

const serializeObject = (o) => {
  return Object.keys(o).map(x => {
    if (o[x] && typeof o[x] === 'object') {
      return serializeObject(o[x]);
    }
    if (o[x] === '') {
      return EMPTY_STRING;
    }

    return o[x];
  }).join('-');
};

export const serialize = (x) => {
  if (x instanceof Date) {
    return x.toISOString();
  }
  if (x instanceof Object) {
    return serializeObject(x);
  }
  return x;
};
