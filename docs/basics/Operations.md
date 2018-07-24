# Operations

Ladda shows its whole potential in a create, read, update & delete application. The four pillars are the basic functions for a persistent storage. These are used in most RESTful APIs yet Ladda can opt-in to benefit from the paradigm. Below is a list of Ladda's requirements on API-functions of each type.

* **CREATE**: An API call which returns an EntityValue (object with an ID, eg. a user).

* **READ**: An API call which returns an EntityValue, or a list of EntityValues (eg. a user or list of users).

* **UPDATE**: Takes the updated EntityValue as the first argument (eg. a user). No assumptions on what is returned by the server are made. The first argument provided is used to update the cache.

* **DELETE**: Takes an ID as the first argument. No assumptions on what is returned by the server are made.

* **COMMAND**: Takes any arguments and expects an updated EntityValue, or a list of them, as return value. This return value is used to update the cache.

* **NO_OPERATION** : When no operation is specified Ladda will not do anything by default. However, you can still use the invalidation logic of Ladda, see EntityConfig. No assumptions on what is returned by the server are made.

An example of how a function of operation CREATE might look is:

```javascript
createUser.operation = 'CREATE';
function createUser(user) {
    return performPostRequest('/api/user', user);
}
```

Note that the backend must return a User in the example above. The user must have an ID, by default as the property "id" (eg. user.id).
