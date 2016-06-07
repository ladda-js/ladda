# ladda
JavaScript data fetching layer with support for middleware.

# What does this do
At its core this is just a registery of data fetching methods.
You register a module and its methods becomes available, eg:

const datastore = buildDatastore();
registerApi('Github', Github)(datastore);
datastore.Github.getRepos();

However, Ladda does support middleware, which is what distinguish it
from just a bunch of fetch methods.

# Middleware
Formally middleware is a object { preRead : function, preWrite : function, postRead : function, postWrite : function }

Where

  preRead : next, apiName, toDecorateName, multipleEntities, args
  
  preWrite : next, apiName, toDecorateName, multipleEntities, args
  
  postWrite : apiName, toDecorateName, multipleEntities, args
  
  postRead : apiName, toDecorateName, multipleEntities, args

  next: function that calls the next middleware or the decorated API method
  
  apiName: Name of api, eg. Github
  
  toDecorateName: Name of function being decorated, eg. getRepos
  
  multipleEntities: true if the function being decorated operates on/with multiple entities
  
  args: Arguments given by the user, eg {id: 1, val: 'hej'} in datastore.Message.post({id: 1, val: 'hej'});

Note that preRead and preWrite are chained with other middleware and finally the api function. This means that they can stop the execution. For instance a caching middleware can, if there's a cache hit, prevent the api function from being called and instead return the value from the cache.

# Try it out
Clone the repo, go to the folder (eg. /ladda) and run: webpack-dev-server
Inspect the network traffic and play around with src/example/index.js.

# Example
Check out /src/example for a really simple example. This should quickly give you an idea of what this is about.

# Why
This is just a really simple way to decorate your api functions. The main use case is caching. The provided caching middleware is the most valueable piece of code here. It let's you decorate your api functions with meta data ({type, entity, multipleEntities}). Every API function is given a unique type and is assumed to be an object o such that o.id is unique for the producing function's specified type. This makes it trivial to cache given caching rules specified for each type. If no caching rules are specified it is assumed that caching is non desired.
