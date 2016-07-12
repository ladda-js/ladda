export function merge(source, destination) {
    const result = { ...destination };

    const keysForNonObjects = getNonObjectKeys(source);
    keysForNonObjects.forEach(key => {
        if (destination[key] !== undefined) {
            result[key] = source[key];
        }
    });

    const keysForObjects = getObjectKeys(source);
    keysForObjects.forEach(key => {
        if (destination[key] !== undefined) {
            result[key] = merge(source[key], destination[key]);
        }
    });

    return result;
}

function getNonObjectKeys(object) {
    return Object.keys(object).filter(key => {
        return object[key] === null
            || typeof object[key] !== 'object'
            || Array.isArray(object[key]);
    });
}

function getObjectKeys(object) {
    return Object.keys(object).filter(key => {
        return object[key] !== null
            && !Array.isArray(object[key])
            && typeof object[key] === 'object';
    });
}
