export default {
    Wikipedia: {
        _types: {
            WikipediaPost: {
                ttl: 5,
                waitForDenormalizationOn: ['Github.getRepos'],
            }
        },

        getAllPosts: 'WikipediaPost',
        getSingle: 'WikipediaPost'

    },

    Github: {
        _types: {
            GithubRepo: {
                ttl: 2
            }
        },

        getRepos: 'GithubRepo',
        getRepo: 'GithubRepo'
    }
};
