import {serialize} from 'serializer';
import {curry, map} from 'fp';

export const addId = curry((aFn, args, o) => {
    if (aFn && aFn.idFrom === 'ARGS') {
        if (Array.isArray(o)) {
            throw new Error('Array not supported');
        }
        return {
            ...o,
            __ladda__id: serialize(args),
            __ladda__blob: true
        };
    } else {
        if (Array.isArray(o)) {
            return map(x => ({
                ...x,
                __ladda__id: x.id
            }), o);
        } else {
            return {
                ...o,
                __ladda__id: o.id
            };
        }
    }
});

export const removeId = (o) => {
    if (!o) {
        return o;
    }

    if (Array.isArray(o)) {
        return map(x => {
            delete x.__ladda__id;
            delete x.__ladda__blob;
            return x;
        }, o);
    } else {
        delete o.__ladda__id;
        delete o.__ladda__blob;
        return o;
    }
};
