export function createQuery(type, value, moreIdentifiers) {
    if (moreIdentifiers) {
        return {
            type,
            ...moreIdentifiers,
            value
        };
    } else {
        return {
            type,
            value
        };
    }
}

export function createQueryFromItem(type, item) {
    return createQuery(type, item.id);
}
