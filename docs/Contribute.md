# Contribute

We'd love to see others help out with Ladda. There's definitely room for improvement everywhere. Testing, documentation, coding, thinking about new features yet more important refining existing features.

## Guidelines

Things that are important to us:

- Before creating a PR, make sure to write up an Issue

- When creating a PR, make sure to have essential test coverage

- The core API needs to be stable - try to not change it or have good reasons for changing it

- Don't try make Ladda something else - it is not Relay/GraphQL

- Keep it simple - think about how to allow for a plugin that does what you think of rather than extending Ladda unless it is obviously something that belongs in Ladda's core code.

## Further Feature Ideas

Just a collection of ideas, might happen but might also not happen:

- Expose when an entity has been manipulated with the goal to make it easy to extend Ladda outside of the core code (eg. to build framework integrations).

- Optimistic updates

- Framework integrations (for example a React HOC that re-renders on changes to entities) that should be an independent library

- Multiple request support (handle the case were Ladda gets multiple requests before the first one has resolved)

- Garbage collection - Eg. Keep track of data without any references and no "byId" ApiFunctions. Delete it.

- Cache aliases (allow a ApiFunction to write to another ApiFunctions cache, useful for polling)

Feel free to propose a feature in the Issues.
