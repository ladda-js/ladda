# Ladda
JavaScript data fetching layer with caching.

# Background
When building a SPA, for example with React or Angular, you eventually need to have some kind of client side caching. You want stuff to be instant, but as the number of users increase the performance decline and your application's complexity increase because of all ad-hoc caching you start to add here and there. There are plenty of solutions out there, but typically they are very ambitious and pollute your application code with complexity. Ladda tries to keep things simple by moving data fetching, and especially caching, into a separate layer. **The goal is that you fetch your data everytime you want it**. Say that you have a user profile page which contains, really expensive to fetch, messages about the user. By far more than I should have, I have seen "if (inCache(...)) { ... } else { ... }". Gone are those sights. With Ladda you fetch your data everytime you want it. Either it comes from the cache or from a HTTP request. You don't have to care, you can just sit back and see the server load decline as well as your app magically become faster.

# What does this do
At its core this is just a registery of data fetching methods. You register a module and its methods becomes available, eg:

```javascript
const datastore = createDatastore();
const configure = compose(
  registerMiddleware(caching(cacheConfig)),
  registerApi('Github', Github),
  registerApi('JsonPlaceholder', JsonPlaceholder)
);

const api = build(configure(datastore));
api.JsonPlaceholder.getAllPosts().then((posts) => console.log('posts', posts));
```

However, Ladda does support caching, which is what distinguish it
from just a bunch of fetch methods.

# Code
Check out [/src/example](https://github.com/petercrona/ladda/blob/master/src/example/index.js) for a really simple example. This should quickly give you an idea of what this is about. The example API is defined in [/src/example/api/jsonplaceholder](https://github.com/petercrona/ladda/blob/master/src/example/api/jsonplaceholder.js) and the cache confing you find in [/src/example/cache-config.js](https://github.com/petercrona/ladda/blob/master/src/example/cache-config.js).

# Try it out
Clone the repo, go to the folder (/ladda) and run: *webpack-dev-server*.
Inspect the network traffic and play around with src/example/index.js.
