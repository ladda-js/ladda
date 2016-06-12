const defaultTTL = 300;

export default {
    JsonPlacerholderPost: {
        ttl: defaultTTL,
        invalidateOnCreate: true
    },
    GithubRepo: {
        ttl: defaultTTL
    }
};
