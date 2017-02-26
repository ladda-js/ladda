export const debug = (x) => {
    console.log(x);
    return x;
};

// a -> a
export const identity = x => x;

// VarFn -> VarFn
export const curry = (f) => (...args) => {
    const nrArgsRequired = f.length;
    if (args.length < nrArgsRequired) {
        return curry(f.bind(null, ...args));
    } else {
        return f(...args);
    }
};

export const startsWith = curry((x, xs) => xs.indexOf(x) === 0);

export const join = curry((separator, x, y) => x + separator + y);

export const on = curry((f, g, h, x) => f(g(x), h(x)));

// a -> a -> bool
const isEqual = curry((x, y) => x === y);

// UnFn -> UnFn -> UnFn -> Value -> Value -> BiFn
export const on2 = curry((f, g, h, x, y) => f(g(x), h(y)));

export const init = xs => xs.slice(0, xs.length - 1);

export const tail = xs => xs.slice(1, xs.length);

export const last = xs => xs[xs.length - 1];

export const head = xs => xs[0];

// Function -> [a] -> [b]
export const map = curry((fn, xs) => xs.map(fn));

// Function -> [a] -> ()
export const map_ = curry((fn, xs) => { map(fn, xs); });

export const reverse = xs => xs.slice().reverse();

// (a -> b -> a) -> a -> [b] -> c
export const reduce = curry((f, currResult, xs) => {
    map_((x) => {
        currResult = f(currResult, x);
    }, xs);
    return currResult;
});

export const compose = (...fns) => (...args) =>
    reduce((m, f) => f(m), last(fns)(...args), tail(reverse(fns)));

// String -> Object -> Value
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

// BiFn -> BiFn
export const flip = fn => curry((x, y) => fn(y, x));

// Object -> [[key, val]]
export const toPairs = x => {
    const keys = Object.keys(x);
    const getValue = flip(prop)(x);
    return zip(keys, map(getValue, keys));
};

// [[key, val]] -> Object<Key, Val>
export const fromPairs = xs => {
    const addToObj = (o, [k, v]) => o[k] = v;
    return reduce(addToObj, {}, xs);
};

// ([a, b] -> c) -> Object<a, b> -> [c]
export const mapObject = on2(map, identity, toPairs);

const writeToObject = curry((o, k, v) => {
    o[k] = v;
    return o;
});

// (a -> b) -> o -> o
export const mapValues = curry((fn, o) => {
    const keys = Object.keys(o);
    return reduce((m, x) => {
        m[x] = fn(o[x]);
        return m;
    }, {}, keys);
});

// [Object] -> Object
export const toObject = curry((getK, xs) => reduce(
    (m, x) => writeToObject(m, getK(x), x),
    {},
    xs
));

const getFirstMatchingPattern = curry((args, result, pattern) => {
    if (result) { return result; }

    const fn = last(pattern);
    const patternsFromConfig = init(pattern);
    const patternsFromArgs = args.slice(0, patternsFromConfig.length);
    const argsFromArgs = args.slice(patternsFromConfig.length);

    if (isEqual(patternsFromConfig, patternsFromArgs)) {
        return fn(...argsFromArgs);
    }

});

export const ifs = (...config) =>
    (...args) => {
        const result = reduce(getFirstMatchingPattern(args), null, config);
        if (result) {
            return result;
        } else {
            const [pattern, otherwiseCandidate] = last(config);
            if (pattern === '_otherwise') {
                return otherwiseCandidate(...args);
            } else {
                throw new Error('Non-exhaustive pattern');
            }
        }
    };
