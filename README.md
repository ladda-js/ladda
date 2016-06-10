# Ladda
JavaScript data fetching layer with support for middleware.

# Background
When building a SPA, for example with React or Angular, you eventually need to have some kind of client side caching. You want stuff to be instant, but as the number of users increase the performance decline and your application's complexity increase because of all ad-hoc caching you start to add here and there. There are plenty of solutions out there, but typically they are very ambitious and pollute your application code with complexity. Ladda tries to keep things simple by moving data fetching, and especially caching, into a separate layer. **The goal is that you fetch your data everytime you want it**. Say that you have a user profile page which contains, really expensive to fetch, messages about the user. By far more than I should have, I have seen "if (inCache(...)) { ... } else { ... }". Gone are those sights. With Ladda you fetch your data everytime you want it. Either it comes from the cache or from a HTTP request. You don't have to care, you can just sit back and see the server load decline as well as your app magically become faster.

# What does this do
At its core this is just a registery of data fetching methods. You register a module and its methods becomes available, eg:

```javascript
const datastore = buildDatastore();
registerApi('Github', Github)(datastore);
datastore.Github.getRepos();
```

However, Ladda does support middleware, which is what distinguish it
from just a bunch of fetch methods.

# Middleware
Formally middleware is a object { preRead : function, preWrite : function, postRead : function, postWrite : function }

Where

  *preRead* : next, apiName, toDecorateName, multipleEntities, args
  
  *preWrite* : next, apiName, toDecorateName, multipleEntities, args
  
  *postWrite* : apiName, toDecorateName, multipleEntities, args
  
  *postRead* : apiName, toDecorateName, multipleEntities, args

And the parameters

  *next*: function that calls the next middleware or the decorated API method
  
  *apiName*: Name of api, eg. Github
  
  *toDecorateName*: Name of function being decorated, eg. getRepos
  
  *multipleEntities*: true if the function being decorated operates on/with multiple entities
  
  *args*: Arguments given by the user, eg {id: 1, val: 'hej'} in datastore.Message.post({id: 1, val: 'hej'});

Note that preRead and preWrite are chained with other middleware and finally the fetch function. This means that they can stop the execution. For instance a caching middleware can, if there's a cache hit, prevent the fetch function from being called and instead return the value from the cache.

# Try it out
Clone the repo, go to the folder (/ladda) and run: *webpack-dev-server*.
Inspect the network traffic and play around with src/example/index.js.

# Example
Check out [/src/example](https://github.com/petercrona/ladda/blob/master/src/example/index.js) for a really simple example. This should quickly give you an idea of what this is about. The example API is defined in [/src/example/api/jsonplaceholder](https://github.com/petercrona/ladda/blob/master/src/example/api/jsonplaceholder.js).

# Caching
This is just a really simple way to decorate your api functions. The main use case is caching. The provided caching middleware is the most valueable piece of code here. It requires you decorate your fetch functions with meta data ({type, entity, multipleEntities}). Every fetch function is given a type and each instance of a type is assumed to be an object o such that o.id is uniquely indentifying the instance of that type. This makes it trivial to cache given caching rules specified per type. If no caching rules are specified it is assumed that caching is not desired for the type.
