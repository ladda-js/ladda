# Plugins

Ladda was built with extensibility in mind and features a powerful
plugin API to build additional functionality on top of its simple core.

Under the hood Ladda's core functionality (caching, views and
invalidation) is implemented using this API as well.

Check out the [Cheat Sheet](/docs/advanced/Plugins-CheatSheet.md) to get an
overview on a single glance and take a look at our [curated list of
already built plugins](/docs/advanced/Plugins-KnownPlugins.md).

## Building a simple logger plugin

At its core a plugin is a higher order function, which returns a mapping
function, which is invoked for each __ApiFunction__ you specified in
your Ladda configuration - it is is supposed to return a
new enhanced version of the given ApiFunction.

Let's start with the minimal boilerplate, which is needed to get a
plugin off the ground and then discuss each step in more detail.

```javascript
export const logger = (pluginConfig) => {
  return ({ entityConfigs, config, addListener }) => {
    return ({ entity, fn }) => {
      return (...args) => {
        return fn(...args);
      }
    }
  }
};
```

This is the final version of our simple logger plugin:

```javascript
export const logger = (pluginConfig) => {
  return ({ entityConfigs, config, addListener }) => {
    console.log('Ladda: Setup in progress', entityConfigs, config);

    addListener((change) => console.log('Ladda: Cache change', change));

    return ({ entity, fn }) => {
      return (...args) => {
        console.log(`Ladda: Calling ${entity.name}.${fn.name} with args`, args);
        return fn(...args).then(
          (res) => {
            console.log(`Ladda: Resolved ${entity.name}.${fn.name} with`, res);
            return res;
          },
          (err) => {
            console.log(`Ladda: Rejected ${entity.name}.${fn.name} with`, err)
            return Promise.reject(err);
          }
        );
      }
    }
  }
};
```

### Using your plugin with Ladda

We now need to instruct Ladda to use our plugin. Ladda's `build`
function takes an optional second argument, which allows us to specify a
list of plugins we want to use.


```javascript
import { build } from 'ladda';
import { logger } from './logger';

const config = { /* your ladda configuration */ };

export default build(config, [
  logger()
]);
```

Mind that plugins are evaluated from left to right. Given a list of
plugins like `[a(), b(), c()]` this means that plugin `c` would be able
to see all information the plugins `a` and `b` have provided. The
ApiFunction which is passed to `c` is the ApiFunction produced by `b`,
which itself is passed a reference to the ApiFunction produced by `a`.

<br/>

And that's it! Congratulations, you just built your first Ladda plugin!
You can try to run this code for yourself to see it in action, or open
up your developer console while browsing the [Contact List Example
Application](https://...).

This app uses a more comprehensive implementation of the logger we just
built, which can be found in the
[ladda-logger](https://github.com/ladda-js/ladda-logger) repository.
