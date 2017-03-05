# Contribute
We'd love to see other help out with Ladda. There's definitely room for improvement everywhere. Testing, documentation, coding, thinking about new features and refining existing. Some things that are important to us:

- The core API needs to be stable - try to not change it or have good reasons for changing it.

- Don't try to be something else, such as Relay and GraphQL

- Keep Ladda simple - think about how to allow for a plugin that does what you think of rather than extending Ladda unless it is obviously something that belongs in Ladda's core code.

## Feature Ideas
- Expose when an entity has been manipulated with the goal to make it easy to extend Ladda outside of the core code (eg. to build framework integrations).

- Optimistic Updates

- Framework integrations (for example a React HOC that rerenders on changes to entities)

- Multiple request support (handle the case were Ladda gets multiple requests before the first one has resolved)

- Garbage collection - Eg. Keep track of data without any references and no "byId" ApiFunctions. Delete it.

- Cache aliases (allow a ApiFunction to write to another ApiFunctions cache, useful for polling)
