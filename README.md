# Ladda
Ladda is a tool that moves caching logic, in particular invalidation logic, out from our application code. It allows us to easily model what should be invalidated when an entity is created, updated or deleted. For example, when a user is deleted you might want to invalidate blog posts, since you know that deleting a user also delets all blog posts by the user. Rather than tainting application code with this we can observe that a user was deleted and do what is necessary.

# When to Use Ladda
Ladda is not meant to cover all cases. This is very intentional. Bad libraries are often the result of trying to do too much. You should only use Ladda when you have or intend to follow REST to a high extent. This means:

* Define an entity E such that E.id uniquely identifies the entity.
* Define create, read, update and delete such that:
  * **create: { E  \ {id} }** where E \ {id} means E without id.
  * **update: { E }**
  * **delete: { id }**
  * **read: { id }** where the backend responds with E
  * **readMultiple: { … }** where the backend responds with [E] and “…” is an unique query.

Ladda can be used in more cases. It is very flexible and often allows you to work around issues. But you need to think about how you are using it then. If you want to do some custom solution, where E don’t have an id or call it something else, then you need to use something else or be creative.

# Get Started
To use Ladda you need to configure it and export a API built from the configuration. You might create a file "api/index.js":

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
getProjects.plural = true;
export function getProjects(foo) {
    return get(resource);
}
```

# Main Concepts
**Type**

For example “User” can be a type. API-methods are associated with a type. So for example a method `deleteById(id)` will automatically delete the entry from the cache for “User”. You can think of a type as defining a namespace for the cache.

To define the type user:
```
User: {
    api: userApi
}
```
**Item**

An instance of a type. For example userA and userB are items of type User. Could look like `{ id: “randomId”, name: “Kalle” }`. Always have “id” specified except for when you create a new one.

**Operation**

Ladda follows the CRUD-model. Operations are:
* CREATE: Create a new item, for example a new User, given an item without id specified.
* READ: Get one or multiple items given a query or id.
* UPDATE: Update an item given an item with id specified.
* DELETE: Remove an item given a id.

**ID**

Ladda relies on IDs being available. These are assumed to uniquely identify an entity of a certain type. For example “user.id”, where user is an entity in the type User, is assumed to uniquely identify a specific user. The main assumptions, per operations, are:

*CREATE*:

A function declared with “operation = CREATE” is expected to as its only parameter get an item without the “id” being set. For example:
```
{ name: “Peter”, from: “Sweden”, livingIn: “Germany” }
```
The server is required to respond with `{ id: <uniqueIdForItem> }`. The response can contain more data, but only the id will be used. Note the assumption that the server will not manipulate the entity saved.

*READ - Singular:*

An id is expected to be provided as the only argument. The response from the server is expected to be an item with “id” set.

*READ - Plural:*

An query, which is just an object, is expected to be provided as the only argument. The response from the server is expected to be a list of item. Each item must have an ID specified. Eg. if `[userA, userB]` is returned, userA.id and userB.id are required to be set.

**Singular**

This is defined by setting for example `getUserById.plural = false;`. This is only important for READ. See example above under “READ - Singular”.

**Plural**

This is defined by setting for example `getUserById.plural = true;`. This is only important for READ. See example above under “READ - Plural”.

**Query**

This is only important for “READ - Plural”. Consider an endpoint that gives you all the users born in 1989 and that have names starting with A. A query might look like: `{ nameStartsWith: “A”, born: 1989 }`.


**API**

Every type is associated with an API, which is simply an object with functions. For instance `{ getById: fetchFromDBFunction }`. Each function in the API needs to be decorated with at least “operation”. For example:
```
getById.operation = “READ”;
function getById(id) { return fetchFromDBFunction(id); }
```
It has to return a Promise. As mentioned about, depending on the operation certain requirements are made:

CREATE: An object with id set is returned: { id }
READ - Singular: Single item is returned
READ - Plural: A list of items
UPDATE: No requirements
DELETE: No requirements

# Type Configuration
Example:
```
   projects: {
        ttl: 300,
        invalidates: ['projects', 'projectPreview'],
        invalidatesOn: ['CREATE'],
        api: project
    }
```

**viewOf**

Specifies that the current type is a view of another entity. The super type will influence the cache of the view and vice versa. Eg. if a UserPreview is a view of User, then updating a user's name calling `User.updateName({ id, name })` will update UserPreview.name and vice versa. Default is no super type.

**ttl**

How long the cache is valid in seconds. After the number of seconds specified Ladda will pretend the cached entity don't exist. Default is no TTL (meaning no caching at all).

**invalidates**

Other entities to invalidate on operations specified in "invalidatesOn". Default is none.

**invalidatesOn**

Operations to invalidate on, where operations can be CREATE, READ, UPDATE, DELETE. Default is CREATE.


# API Function Configuration
Example:
```
getAll.operation = 'READ';
getAll.plural = true;
export function getAll(query) {
    return get('/api/v2/downloadable-file', { getData: query });
}

poll.operation = 'READ';
poll.plural = true;
poll.alwaysGetFreshData = true;
poll.invalidates = ['getAll(*)'];
export function poll(query) {
    return get('/api/v2/downloadable-file', { getData: query });
}
```
**alwaysGetFreshData**

Always fetch data (even if it exists in the cache) and save in cache. Default is false.

**plural**

Used when operation is set to READ. Informs Ladda that a list of multiple entities is expected. Default is false.

**invalidates**

Invalidates the query cache for the specified api function in the same type. If suffixed with (*) all caching for the specified api function will be cleared (regardless of which arguments it was called with). Otherwise only api function called without parameters. Default is none.

**operation**

CREATE | READ | UPDATE | DELETE - necessary for Ladda to handle caching correclty. Always has to be specified.

# Try it out
Do a "npm install ladda-cache" in your project. Stay tuned for an example project.
