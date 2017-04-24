# Deduplication

Ladda tries to optimize "READ" operations by deduplicating identical
simultaneous requests and therefore reduce the load both on server and
client.

*Identical* means calling the same function with identical arguments.
<br>
*Simultaneous* means that another call has been made before the first
call has been resolved or rejected.

Given the following code, where `getUsers` is a "READ" operation:

```javascript
// Component 1
api.user.getUsers();

// Component 2
api.user.getUsers();

// Component 3
api.user.getUsers();
```

Ladda will only make a single call to `getUsers` and distribute its
result to all callers.


This feature can be disabled on a global, an entity and a function
level. Check the [Configuration Reference](/docs/basics/Configuration.md) for details.
