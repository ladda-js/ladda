# Plugins Cheat Sheet

## Signature

```javascript
({ entityConfigs, config, addChangeListener }) => ({ entity, fn }) => ApiFn
```

<br/>

It is a good practice to allow your users to pass in an additional
plugin configuration object, thus reaching a final shape like this:

```javascript
export const yourPlugin = (pluginConfig = {}) => {
  return ({ entityConfigs, config, addChangeListener }) => {
    // Use this space to setup additional data structures and helpers,
    // that act across entities.
    return ({ entity, fn }) => {
      // Use this space to setup additional data structures and helpers,
      // that act on a single entity.
      return (...args) => {
        // Do your magic here!
        // Invoke the original fn with its arguments or a variation of it.
        return fn(...args);
      };
    };
  };
};
```

We commonly refer to this process as __create => setup => decorate__
steps, with the final goal of producing a decorated __ApiFunction__.

## Apply a plugin

Pass plugins in a list of plugins as an optional second argument to
Ladda's `build` function.

```javascript
import { build } from 'ladda-cache';
import { logger } from 'ladda-logger';
import { observable } from 'ladda-observable';

const config = { /* your ladda configuration */ };

export default build(config, [
  observable(),
  logger()
]);
```

Plugins are evaluated from left to right.

