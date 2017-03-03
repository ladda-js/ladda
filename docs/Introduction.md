# Introduction

Ladda is an independent, lightweight cache solution in a JavaScript application. It is a library simple to opt-in yet designed for sophisticated cache management.

## Lightweight

Ladda is a lightweight and independent of third party dependencies solution for caching. The library has only a size of **TODO** KB. No third party libraries are included thus it comes without any dependencies.

In its implementation Ladda uses functional programming principles. Therefore the source code is concise and deterministic yet great to reason about. You can convince yourself by looking into the [source code of the repository](https://github.com/petercrona/ladda/tree/master/src).

## Independent

Apart from being independent from any dependencies internally, Ladda is framework and library agnostic in its usage. It doesn't depend on the latest single page application solution. It doesn't reinvent the wheel of caching every time a new framework comes around. You can use it in your evolving application as your caching solution.

## Low Buy-In

Because Ladda is independent and lightweight, it is already a low buy in to use the library as your caching solution. You can exchange your main libraries without the need to adjust or exchange the Ladda cache.

Ladda is a thin envelope around your [API](https://en.wikipedia.org/wiki/Application_programming_interface) layer. Somewhere in your application you might have defined all your outgoing API requests. Ladda will envelope these requests and act as your personal cache. The API requests themselves doesn't change, but Ladda opts in as your cache. You can easily remove the envelope to get rid of Ladda.

## How does it help me?

Nowadays applications often follow the Create, Read, Update and Delete ([CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)) principle. You get a list of items from an API, want to update and delete an item yet also create new items.

Ladda caches your CRUD operations. When you get the list of items, it will cache the result. Every other time you get the list of items, the cached result will be used. You don't perform the request.

In pseudo code the usage of an own cache solution would look like the following:

```
var result;

if (/* check if result is cached */) {
  // get result from cache
  result = cache.getList();
} else {
  // get result from API
  result = apiService.getList();

  // store result in cache
  cache.put(/* store result and index */)
}

return result;
```

In contrast, Ladda shields away the cache layer for you:

```
result = apiService.getList();
return result;
```

The `getList()` request would look the same form the outside. You only reach out to your API service to handle the request. At the place where you define the API service, Ladda would be a thin decorator for your `getList()` functionality.

```
getList.operation = 'READ';
function getList() {
  // API request
}
```

That's only the `READ` operation in CRUD though. Your own cache solution wouldn't respect the `CREATE`, `UPDATE` or `DELETE` operations. That would be more difficult to implement and that's where Ladda comes in as your cache solution.

[Ladda does respect those operations](/docs/basics/Operations.md). When you update the list, by using a `CREATE`, `UPDATE` or `DELETE` operation with the Ladda cache layer, the requests are still made to the API. However, Ladda will take care of updating your cache. Once you request the list of items again from the API, you will get the updated result from the cache.

## When should I use it?

Ladda is not meant to cover all cases. This is very intentional. Bad libraries are often the result of trying to do too much. You should only use Ladda when you have or intend to follow [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) to a high extent.

Ladda follows the CRUD principle. Imagine your entitity supports the `READ` operation on single and multiple entities yet you can `UPDATE`, `DELETE` and `CREATE` entities. Ladda offers you a thin cache solution with a low-buy in for these operations.

Ladda acts as your cache management in advanced scenarios too. It cannot only be used for single CRUD entities. When you use multiple entities, there are options for [invalidation](/docs/advanced/Invalidation.md) or [entitiy composition](/docs/advanced/ViewOf.md).

## Next Steps

You should convince yourself by trying the [Demo](/docs/Demo.md). But keep in mind that Ladda comes with more advantages than being a simple `READ` operation cache. It supports all the CRUD operations. Even though you make all the different operations as requests to your API, Ladda keeps the cache in sync.

If you already want to get started, checkout the [Getting Started](/docs/GettingStarted.md) section.
