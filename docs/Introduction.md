# Introduction
Ladda is an independent, lightweight caching solution for your JavaScript application. It is a library simple to get started with yet supports sophisticated cache management. Let's start by looking at the background of Ladda and then look at how it can be useful for you and how to proceeed if you want to give Ladda a shot.

## Background
Ladda was created to solve a real problem at Small Improvements. At Small Improvements we are developing an application to manage and facilitate feedback within a company. Both more formal, such as the yearly performance appraisals many companies have, but also less formal such as an employee wanting to praise another employee or request feedback from a couple employees, for example after having a presentation or after finishing a project. In addition to this we handle many more things, such as goals or objectives and a vast number of integrations and customizations. The main point is that it is a fairly complex piece of software, and it is built as a single page application.

The issue we started to encounter was that loading all the data took quite a while, especially for large companies. First step was to ensure that we only loaded the data that is needed. However, even this was quite a lot of data. We started to explorer different solutions, we invested quite a lot in evaluating GraphQL and Relay. However, we didn't find anything that made us really happy. We previously switched from Angular 1 to React and we wanted a solution that would make it easier, rather than harder, to jump single page application framework the next time. In addition to this, we didn't want our application code to get more complex, but if anything, we would like it to get less complex. We didn't feel that any existing solution fullfilled all our wishes.

We were a couple of guys at Small Improvements that got really intrerested in this topic, we started to look around for more solutions and experiment with our own solutions. Finally we met and discussed our findings. We picked Ladda for its simplicity, it living outside of the application code and it promoting something that we thought is a good idea in general: well-defined entities. We also realized that using something that is not aware of the framework would help us to synchronize data between React and Angular (we are still using both frameworks). Ladda doesn't care if the request comes from React or Angular, and the cache works regardless of where the request originated. Hence we could synchronize data between Angular and React without doing anything more than using Ladda. If we loaded all users in Angular, updated one of them, and then loaded all users in React, we would get the latest data in React without the need for a API-request. This is how Ladda was born. But enough history, let's get more concrete and look at what benefits you can get.

## How Does It Help Me?
Nowadays applications often are centered around the Create, Read, Update and Delete ([CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)) operations. You get a list of items from an API, want to update and delete an item or maybe create a new item.

Ladda caches your CRUD operations. When you get the list of items, it will cache the result. Every subsequent time you get the list of items, the cached result will be used. You don't perform the request.

In pseudo code, an ad-hoc caching solution often looks like the following:

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

In contrast to this, Ladda shields away the cache layer for you and you end up with:

```
return apiService.getList();
```

The `getList()` request would look the same from the outside. You only reach out to your API layer to handle the request. At the place where you define the API layer, Ladda would be a thin decorator for your `getList()` functionality.

```
getList.operation = 'READ';
function getList() {
  // API request
}
```

That's only the `READ` operation in CRUD though. A simple ad-hoc caching solution (as above) doesn't support the `CREATE`, `UPDATE` or `DELETE` operations. Those are a bit more difficult to implement and that's where Ladda will help you. 

[Ladda does support those operations](/docs/basics/Operations.md). When you update the list, by using a `CREATE`, `UPDATE` or `DELETE` operation, the requests are made to the API as usual. However, Ladda will also update your cache. Once you request the list of items again from the API, you will get the updated result from the cache without making a new API-request. For example, if you changed the name of a user, there's no need to refetch all users from you backend. Ladda ensures that you get up to date data if you would for example call "getAllUsers" again, without an API-request being made.

# When to Use Ladda
Ladda is not meant to cover all possible use cases. To get the full power of Ladda you need to have **well-defined entities**. For example, you might have an entity User, which contains an id, name, email and contact details. Then you might have an entity ListUser, which only contains an id and a name. The important bit is that these concepts exist and that you refer to them as User and ListUser rather than "A user might have an id, name, email and contact details, but sometimes only id and name".

Of course, if you come up with creative ways of using Ladda, go ahead! You can quite easily use Ladda just as a simple cache for external calls, in which case you don't need a well-defined entity. But to leverge the more advanced parts, well-defined entities are necessary.

## Next Steps
You should convince yourself by trying the [Demo](/docs/Demo.md). Keep in mind that Ladda comes with more advantages than being a simple `READ` operation cache. It supports all the CRUD operations. Ladda keeps your cache in sync and minimizes the number of requests made to the backend. Data is only refetched if it has to be.

If you already want to get started, checkout the [Getting Started](/docs/GettingStarted.md) section.
