export const debug = (x) => {
  console.log(x); // eslint-disable-line no-console
  return x;
};

export const identity = x => x;

export const curry = (f) => (...args) => {
  const nrArgsRequired = f.length;
  if (args.length < nrArgsRequired) {
    return curry(f.bind(null, ...args));
  }
  return f(...args);
};

export const passThrough = curry((f, x) => {
  f(x);
  return x;
});

export const startsWith = curry((x, xs) => xs.indexOf(x) === 0);

export const join = curry((separator, x, y) => x + separator + y);

export const on = curry((f, g, h, x) => f(g(x), h(x)));

// a -> a -> bool
export const isEqual = curry((x, y) => x === y);

// bool -> bool
export const not = x => !x;

export const on2 = curry((f, g, h, x, y) => f(g(x), h(y)));

export const init = xs => xs.slice(0, xs.length - 1);

export const tail = xs => xs.slice(1, xs.length);

export const last = xs => xs[xs.length - 1];

export const head = xs => xs[0];

export const map = curry((fn, xs) => xs.map(fn));

export const map_ = curry((fn, xs) => { map(fn, xs); });

export const reverse = xs => xs.slice().reverse();

export const reduce = curry((f, currResult, xs) => {
  map_((x) => {
    currResult = f(currResult, x);
  }, xs);
  return currResult;
});

export const compose = (...fns) => (...args) =>
    reduce((m, f) => f(m), last(fns)(...args), tail(reverse(fns)));

export const prop = curry((key, x) => x[key]);

// [a] -> [b] -> [[a, b]]
export const zip = curry((xs, ys) => {
  const toTake = Math.min(xs.length, ys.length);
  const zs = [];
  for (let i = 0; i < toTake; i++) {
    zs.push([xs[i], ys[i]]);
  }
  return zs;
});

// BinaryFn -> BinaryFn
export const flip = fn => curry((x, y) => fn(y, x));

// Object -> [[key, val]]
export const toPairs = x => {
  const keys = Object.keys(x);
  const getValue = flip(prop)(x);
  return zip(keys, map(getValue, keys));
};

// [[key, val]] -> Object<Key, Val>
export const fromPairs = xs => {
  const addToObj = (o, [k, v]) => passThrough(() => { o[k] = v; }, o);
  return reduce(addToObj, {}, xs);
};

// ([a, b] -> c) -> Map a b -> [c]
export const mapObject = on2(map, identity, toPairs);

const writeToObject = curry((o, k, v) => {
  o[k] = v;
  return o;
});

// (a -> b) -> Object -> Object
export const mapValues = curry((fn, o) => {
  const keys = Object.keys(o);
  return reduce((m, x) => {
    m[x] = fn(o[x]);
    return m;
  }, {}, keys);
});

// Object<a, b> -> [b]
export const values = mapObject((pair) => pair[1]);

// (a -> b) -> [Object] -> Object<b, a>
export const toObject = curry((getK, xs) => reduce(
  (m, x) => writeToObject(m, getK(x), x),
  {},
  xs
));

const takeIf = curry((p, m, x) => {
  if (p(x)) {
    m.push(x);
  }
  return m;
});

export const filter = curry((p, xs) => {
  return reduce(takeIf(p), [], xs);
});

// Object -> Object
export const clone = o => {
  if (Array.isArray(o)) {
    return o.slice(0);
  }
  if (typeof o === 'object') {
    return {...o};
  }
  throw new TypeError('Called with something else than an object/array');
};

// (a -> bool) -> Object -> Object
export const filterObject = curry((p, o) => {
  const getKeys = compose(filter(p), Object.keys);
  const getProperty = flip(prop);
  const keys = getKeys(o);
  const createObject = compose(fromPairs, zip(keys), map(getProperty(o)));

  return createObject(keys);
});

export const copyFunction = f => {
  const newF = f.bind(null);
  for (const x in f) {
    if (f.hasOwnProperty(x)) {
      newF[x] = f[x];
    }
  }
  return newF;
};

export const get = curry((props, o) => {
  return reduce((m, p) => {
    if (!m) { return m; }
    return prop(p, m);
  }, o, props);
});

export const set = curry((props, val, o) => {
  if (!props.length) { return o; }
  const update = (items, obj) => {
    if (!items.length) { return obj; }
    const [k, nextVal] = head(items);
    const next = items.length === 1 ? nextVal : { ...prop(k, obj), ...nextVal };
    return { ...obj, [k]: update(tail(items), next) };
  };

  const zipped = [...map((k) => [k, {}], init(props)), [last(props), val]];
  return update(zipped, o);
});

export const concat = curry((a, b) => a.concat(b));

export const flatten = (arrs) => reduce(concat, [], arrs);

export const uniq = (arr) => [...new Set(arr)];

export const fst = (arr) => arr[0];
export const snd = (arr) => arr[1];

