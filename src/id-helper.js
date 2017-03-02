import {serialize} from 'serializer';
import {curry, map} from 'fp';

export const addId = curry((aFn, args, o) => {
    if (aFn && aFn.idFrom === 'ARGS') {
        return {
            ...o,
            __ladda__id: serialize(args)
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
            return x;
        }, o);
    } else {
        delete o.__ladda__id;
        return o;
    }
};
