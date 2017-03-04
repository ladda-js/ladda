# Ladda
Ladda is a library that helps you with caching, invalidation of caches and to handle different representations of the same data in a performant and memory efficient way. The main goal with Ladda is to make it easy for you to add sophisticated caching without making your application code more complex. Ladda will take care of logic that would otherwise increase the complexity of your application code, and it will do so in a corner outside of your application. You can expect a significant performance boost (if you didn't have any caching already) with possibly no changes to you application code. Ladda is designed to be something you can ignore. When developing your application you shouldn't care about Ladda nor caching. You should just assume that backend calls are for free, that they will be cached if possible and data will be refetched if it has to. If you get bored of Ladda you can easily get rid of it. Ladda is designed to influence your application code as little as possible. We want you to get hooked, but not because of the cost of getting rid of Ladda.

# When to Use Ladda
Ladda is not meant to cover all possible use cases. You should use Ladda when you have clear entities. The entities need to be well-defined, for example, you might have a User entity, which contains an id, name, email and contact details. Then you might have a ListUser which only contains an id and a name. The important bit is that these concepts exist and that you refer to them as User and ListUser rather than "A user might have an id, name, email and contact details, but sometimes only id and name". Of course, if you come up with creative ways of using Ladda, and they provide you with a benefit, go ahead!  

# Get Started
Do a `npm install ladda-cache` in your project. Now, to use Ladda you need to configure it and export a API built from the configuration. You might create a file "api/index.js":

```javascript
import * as project from './project';
import { build } from 'ladda-cache';

const config = {
    projects: {
        ttl: 300,
        api: project
    }
};

export default build(config);
```

where project is a bunch of api-methods returning promises, eg:

```javascript
createProject.operation = 'CREATE';
export function createProject(project) {
    return post(resource, { postData: project });
}

getProjects.operation = 'READ';
export function getProjects() {
    return get(resource);
}
```

# Concepts
* ID: Unique identifier for a EntitiyValue. By default assumed to be the property "id" of an object. But can be overriden (see Ladda Config).

* EntityValue: An object with an ID

* BlobValue: Does not require an ID. Can be either a list, an object or just a single value. Suitable when you just want to cache an API call.


# Operations
* CREATE: An API call which returns an EntitiyValue.

* READ: An API call which returns an EntityValue, or a list of EntityValues.

* UPDATE: Takes the updated EntitiyValue as the first argument. No assumptions on what is returned by the server are made.

* DELETE: Takes an ID as the first argument. Server must return 200, or the delete will be reverted. No assumptions on what is returned by the server are made.

* NO_OPERATION : When no operation is specified Ladda will not do anything by default. However, you can still use the invalidation logic of Ladda, see EntityConfig. No assumptions on what is returned by the server are made.


# Entity Configuration
* ttl: How long to cache in seconds. Default is 300 seconds.

* invalidatesOn: [Operation] where Operation := CREATE | READ | UPDATE | DELETE | NO_OPERATION. Default is [CREATE, UPDATE, DELETE].

* invalidates: [EntityName] where EntitiyName is the key of your EntitiyConfig. By default an empty list [].

* viewOf: EntitiyName. Only specify if this is a subset for another entitiy (all fields must exist in the other entity).

* api (required): A collection of ApiFunctions, functions that communciate with an external service and return a Promise.

# Method Configuration
* operation: CREATE | READ | UPDATE | DELETE | NO_OPERATION. Default is NO_OPERATION.

* invalidates: [ApiFunction] where ApiFunction is any other function in the same api (see EntitiyConfig). By default this is the empty list [].

* idFrom: "ENTITY" | "ARGS" | Function. Where "ARGS" is a string telling Ladda to generate an id for you by serializing the ARGS the ApiFunction is called with. "ARGS" will also tell Ladda to treat the value as a BlobValue. Function is a function (EntitiyValue -> ID). By default ENTITY.

* byId: true | false. This is an optimization that tells Ladda that the first argument is an id. Hence Ladda can directly try to fetch the data from the cache, even if it was acquired by another call. This is useful if you previously called for example "getAllUsers" and now want to fetch one user directly from the cache. By default false.


# Ladda Configuration
* idField: Specify the default property that contains the ID. By default this is "id".

# Contribute
Please let me know if you have any feedback. Fork the repo, create PRs and create issues! For PRs with code, don't forget to write tests.
