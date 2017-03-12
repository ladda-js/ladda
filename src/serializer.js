const serializeObject = (o) => {
    return Object.keys(o).map(x => {
        if (o[x] && typeof o[x] === 'object') {
            return serializeObject(o[x]);
        } else {
            return o[x];
        }
    }).join('-');
};

export const serialize = (x) => {
    if (x instanceof Object) {
        return serializeObject(x);
    } else {
        return x;
    }
};
