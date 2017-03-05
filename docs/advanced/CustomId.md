# Custom ID
Ladda needs a unique identifier for every EntitiyValue to cache it. By default Ladda assumes that every EntitiyValue has this identifier as a property `id`. Of course, we realize that this is not always true, so you can configure what to use as a identifier in a couple of ways.

## Default ID Property
Sometimes you have ids, but they are called `_id` or `objectID` or something else. In this case you will need to tell Ladda about this, for example, if your default ID property is `objectID`, you could configure this as:

```
const config = {
    user: {
        ttl: 60,
        api: userApi
    },
    __config: {
        idField: 'objectID'
    }
};
```
This will tell Ladda to always pick `objectID` rather than `id` as the ID for the EntitiyValue.

## Override ID Property for ApiFunction
There are always exceptions. Maybe most of your API use `objectID` as the ID property. But a few parts of your API use `_id`. This can easily be handled by configuring your ApiFunctions as:

```
getUser.operation = 'READ';
getUser.idFrom = user => user._id;
function getUser(id) {
    return performGetRequest('/api/user', id);
}
```
This will tell Ladda to always pick `_id` rather than `objectID` as the ID for the EntitiyValue.

## No ID at All
Finally, you might not have any ID. For example, if your endpoint uses a custom format. In general, we recommend you to put some effort into getting an ID. For example by updating your backend, preprocessing your response in your ApiFunction or to use `idFrom` with a function. However, if you do not plan to manipulate the response (eg. update and post the updated version to your backend), then you can treat it as a BlobValue. This means that Ladda will not try to do anything clever except of caching the value and returning it if you call the same method with the same arguments. Basically, it will be equivalent to the good ol' `if (inCache) { return cachedValue; } else { val = loadValue; putInCache(val); return val;}`. This removes the requirement of the response having an ID, the ID will be created by Ladda by serializing the arguments the ApiFunction is called with. To enable this, configure your ApiFunction as:

```
getHackernewsArticles.operation = 'READ';
getHackernewsArticles.idFrom = 'ARGS';
function getHackernewsArticles(query) {
    return performGetRequst(HACKERNEWS_SEARCH_URL, query);
}
```

This will work regardless of what Hackernews returns. And calling the ApiFunction with the same query twice will give you a cached result. However, if you had a `updateHackernewsArticle` ApiFunction, it would not update the cached result later returned by `getHackernewsArticles`. You would need to invalidate `getHackernewsArticles` to prevent stale data:

```
updateHackernewsArticle.operation = 'UPDATE';
updateHackernewsArticle.invalidates = ['getHackernewsArticles'];
function updateHackernewsArticle(newArticle) {
    return performPutRequest(HACKERNEWS_ARTICLE_URL, newArticle);
}

getHackernewsArticles.operation = 'READ';
getHackernewsArticles.idFrom = 'ARGS';
function getHackernewsArticles(query) {
    return performGetRequst(HACKERNEWS_SEARCH_URL, query);
}
```
