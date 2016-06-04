const defaultTTL = 300;

export default {
    WikipediaPost: {
        ttl: defaultTTL,
        waitForDenormalizationOn: ['Github.getRepos'],
    },
    GithubRepo: {
        ttl: defaultTTL
    }
};
