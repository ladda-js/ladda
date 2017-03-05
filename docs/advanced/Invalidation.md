# Invalidation
Ladda caches ApiFunctions with the operation `READ`. By default the cache lives as long as specified as TTL (default 300 seconds). But sometimes you will need to clear the caches before the TTL has expired. This is called invalidation. There are two places where you can configure invalidation. On an entitiy and on a ApiFunction. Normally you will only need to specify it on the entitiy.

## Cache Invalidation on Entitiy
It is not uncommon that entities are related in some way. For example, if you are developing a game you might have a top list. After finishing a game you know that this top list will be updated. Not directly by you, but by your backend as a consequence of you finishing a game. In this case you want to invalidate the currently cached top list, because you know it might have changed. Ladda makes this easy, the configuration would look something like this:

```
const config = {
    topList: {
        ttl: 3600,
        api: topListApi
    },
    game: {
        api: gameApi,
        invalidates: ['topList']
    }
};
```

when you would call for example `api.game.reportFinished(finishedGame)` Ladda would automatically invalidate the topList for you. You also have the ability to make you invalidation a bit more fine-grained. There's a `invalidatesOn` option which allows you to specify on which operation to invalidate the specified entities. For example, it could look like:

```
const config = {
    topList: {
        ttl: 3600,
        api: topListApi
    },
    game: {
        ttl: 300,
        api: gameApi,
        invalidates: ['topList'],
        invalidatesOn: ['UPDATE'] // Default: ['CREATE', 'UPDATE', 'DELETE']
    }
};
```
In addition to the normal CRUD operations, you can specify `invalidatesOn: ['NO_OPERATION']` which allows you to invalidate other entities' caches even if you don't use Ladda to cache the ApiFunction (If no operation is specified on a ApiFunction, Ladda will leave the function alone and not cache it nor update any cache). If necessary, you can also specify invalidation directly on ApiFunctions.

## Cache Invalidation on ApiFunction
Sometimes you will need to invalidate just another ApiFunction's cache. This can be achieved by specifying `invalidates` on a ApiFunction. It might look like this:

```
recalculateTopPlayers.invalidates = ['getTopPlayers'];
function recalculateTopPlayers() {
    return performPostRequst('/api/players/top/recalculate');
}

getTopPlayers.operation = 'READ';
function getTopPlayers() {
    return performGetRequest('/api/players/top');
}

getAllPlayers.operation = 'READ';
function getAllPlayers() {
    return performGetRequest('/api/players');
}

```

Calling `recalculateTopPlayers` would invalidate `getTopPlayers`, so you would get the new top players next time you call `getTopPlayers`. However, `getAllPlayers` would still keep its cache. Note that you can only invalidate other ApiFunctions within the same Api (/in the same entitiy).
