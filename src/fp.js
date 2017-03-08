export const debug = (x) => {
    console.log(x);
    return x;
};

export const identity = x => x;

export const curry = (f) => (...args) => {
    const nrArgsRequired = f.length;
    if (args.length < nrArgsRequired) {
        return curry(f.bind(null, ...args));
    } else {
        return f(...args);
    }
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
export const zip = (xs, ys) => {
    const toTake = Math.min(xs.length, ys.length);
    const zs = [];
    for (let i = 0; i < toTake; i++) {
        zs.push([xs[i], ys[i]]);
    }
    return zs;
};

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
    const addToObj = (o, [k, v]) => passThrough(() => o[k] = v, o);
    return reduce(addToObj, {}, xs);
};

// ([a, b] -> c) -> Object<a, b> -> [c]
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


export const clone = o => {
    if (!o) {
        return o;
    }

    if (Array.isArray(o)) {
        return o.slice(0);
    }
    if (typeof o === 'object') {
        return {...o};
    }
};
