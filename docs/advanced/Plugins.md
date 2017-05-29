# Plugins

Ladda was built with extensibility in mind and features a powerful
plugin API to build additional functionality on top of its simple core.

Under the hood Ladda's core functionality (caching, views and
invalidation) is implemented using this API as well.

Check out the [Cheat Sheet](/docs/advanced/Plugins-CheatSheet.md) to get an
overview on a single glance and take a look at our [curated list of
plugins](/docs/advanced/Plugins-KnownPlugins.md).

## Building a simple logger plugin

At its core a plugin is a higher order function, which returns a
decorator function, which is invoked for each __ApiFunction__ you
specified in your Ladda configuration - it is is supposed to return a
new decorated version of the given ApiFunction.

Let's start with the minimal boilerplate, which is needed to get a
plugin off the ground:

```javascript
export const logger = (pluginConfig = {}) => {
  return ({ entityConfigs, config, addChangeListener }) => {
    return ({ entity, fn }) => {
      return (...args) => {
        return fn(...args);
      };
    };
  };
};
```

These function can be described as three individual steps, which
eventually return a decorate ApiFunction.
We refer to these steps as __create__, __setup__ and __decorate__.

If we were to give these functions names, our boilerplate would look
like this:

```javascript
function create(pluginConfig = {}) {
  return function setup({ entityConfigs, config, addChangeListener }) {
    return function decorate({ entity, fn }) {
      return function decoratedApiFn(...args) {
        return fn(...args);
      }
    }
  }
}
```

### Create: The plugin factory

```javascript
export const logger = (pluginConfig = {}) => {
  return ({ entityConfigs, config, addChangeListener }) => {
    // ...
  };
};
```

It is generally a good practice to expose your plugin as a module, which
is a plugin factory: A function which produces a plugin.

While this is strictly speaking not needed it allows you to take
additional configuration arguments for your plugin.

Our simple logger will not act on any additional configuration for now,
but it is not unreasonable to assume that we might enhance it's
capabilites in the future. We could for example create our plugin like
this: `logger({ disable: true })`, so that we could turn the logger off
with a simple boolean flag.

Try to adhere to this principle, even if your plugin does not take any
configuration arguments when you start out. Also try to provide good
defaults, so that your users can try and play with your plugin easily.

### Setup: Producing the plugin decorator function

```javascript
export const logger = (pluginConfig = {}) => {
  return ({ entityConfigs, config, addChangeListener }) => {
    return ({ entity, fn }) => {
      // ...
    };
  };
};
```

We mentioned earlier, that a plugin is a function which produces a
decorator function, which should return a new decorated ApiFunction.

This function is called exactly once during build time (when Ladda's
`build` function is called).

The Plugin API tries to give you as much information as possible while
you are creating your plugin. The plugin function therefore receives a
single object with the complete entity configuration you specified, the
global ladda configuration and the registration function to add a change
listener.

`entityConfigs` is a slightly enhanced version of the configuration you
defined as first argument of your `build` call. It is a dictionary,
where the keys are __EntityNames__ and the values __EntityConfigs__.

There are three differences to what you initially passed:
- All defaults are applied, so that you can inspect precisely how each
  entity is configured.
- For ease of use each __EntityConfig__ has an additional `name`
  property, which equals to the __EntityName__.
- If you specified a global Ladda configuration with `__config`, you
  will not find it here.

`config` is the global Ladda Configuration you might have specified in
the `__config` field of your build configuration. Even if you left it
out (as it is optional) you will receive an object with applied defaults
here.

`addChangeListener` allows us to register a callback to be invoked each
time something changes inside of Ladda's cache.
The callback is invoked with a single argument, a ChangeObject of the
following shape:


```javascript
{
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'NO_OPERATION',
  entity: EntityName,
  apiFn: ApiFunctionName,
  args: Any[] | null
  values: EntityValue[],
}
```

It provides all information about which call triggered a change,
including the arguments array.

The `values` field is guaranteed to be a list of EntityValues, even if
a change only affects a single entity. The only expection are
`NO_OPERATION` operations, which will always return `null` here.

`addChangeListener` returns a deregistration function. Call it to stop
listening for changes.

<br/>


A more sophisticated plugin would use this space to define additional
data structures, that should act across all entities, hence we refer to
this step as __setup__.

Things are a little simpler with our logger plugin - e.g. it doesn't
hold any state of its own. Let's notify the user that Ladda's setup is
running and present all configuration we received:


```javascript
export const logger = (pluginConfig = {}) => {
  return ({ entityConfigs, config, addChangeListener }) => {
    console.log('Ladda: Setup in progress', pluginConfig, entityConfigs, config);
    return ({ entity, fn }) => {
      // ...
    };
  };
};
```

We can also notify the users about any changes that happen within Ladda
and register a change listener:

```javascript
export const logger = (pluginConfig = {}) => {
  return ({ entityConfigs, config, addChangeListener }) => {
    console.log('Ladda: Setup in progress', pluginConfig, entityConfigs, config);

    addChangeListener((change) => console.log('Ladda: Cache change', change));

    return ({ entity, fn }) => {
      // ...
    };
  };
};
```

We need to return a decorator function here, which will be invoked for
every ApiFunction we defined in our build configuration. Our goal is to
wrap such an ApiFunction and return one with enhanced functionality.


### Decorate: Wrapping the original ApiFunction

```javascript
export const logger = (pluginConfig = {}) => {
  return ({ entityConfigs, config, addChangeListener }) => {
    // ...

    return ({ entity, fn }) => {
      return (...args) => {
        return fn(...args);
      }
    };
  };
};
```

Our decorator function will receive a single argument, which is an object
with two fields:

- `entity` is an __EntityConfig__ as described above. All defaults are
  applied and an additional `name` property is present to identify it.
- `fn` is the original __ApiFunction__ we want to act on. It has all
  meta data attached, that was defined in the build configuration,
including defaults. In addition Ladda's `build` function also added the
property `fnName`, so that we can easily identify it.

With this comprehensive information we can easily add additional
behavior to an ApiFunction.

We return a function which takes the same arguments as the original call
and make sure that we also return the same type. This is again fairly
simple in our logger example, where we can just invoke the original
function with the arguments we receive and return its value.

Let's add some logging around this ApiFunction:

```javascript
export const logger = (pluginConfig = {}) => {
  return ({ entityConfigs, config, addChangeListener }) => {
    // ...

    return ({ entity, fn }) => {
      return (...args) => {
        console.log(`Ladda: Calling ${entity.name}.${fn.fnName} with args`, args);
        return fn(...args).then(
          (res) => {
            console.log(`Ladda: Resolved ${entity.name}.${fn.fnName} with`, res);
            return res;
          },
          (err) => {
            console.log(`Ladda: Rejected ${entity.name}.${fn.fnName} with`, err)
            return Promise.reject(err);
          }
        );
      }
    };
  };
};
```

We issue a first log statement immediately when the function is invoked
and print out the arguments we received. By using the entity
configuration we got passed in and the meta data of the ApiFunction we
can produce a nice string to reveal which function just got called:
`${entity.name}.${fn.fnName}`. This could for example produce
something like `user.getAll`.

We then use Promise chaining to intercept the result of our original
ApiFunction call and log whether the promise was resolved or rejected.
As our logger is a passive plugin that just provides an additional
side-effect (printing to the console), we make sure that we pass the
original results on properly: The resolved promise value, or the error
with which our promise got rejected.

Mind that you can just return a plain function from this decorator
function. You do __NOT__ need to worry about all meta data the `fn` you
received was provided with. Ladda's `build` function will make sure,
that all meta data that was originally defined will be added to the
final API function. This includes additional meta data you define on the
ApiFunction object in your plugin (an example of this can be found in the
[ladda-observable](https://github.com/ladda-js/ladda-observable) plugin, which
adds an additional function to the ApiFunction object).


### Putting it altogether

Here is the final version of our simple logger plugin:

```javascript
export const logger = (pluginConfig = {}) => {
  return ({ entityConfigs, config, addChangeListener }) => {
    console.log('Ladda: Setup in progress', pluginConfig, entityConfigs, config);

    addChangeListener((change) => console.log('Ladda: Cache change', change));

    return ({ entity, fn }) => {
      return (...args) => {
        console.log(`Ladda: Calling ${entity.name}.${fn.fnName} with args`, args);
        return fn(...args).then(
          (res) => {
            console.log(`Ladda: Resolved ${entity.name}.${fn.fnName} with`, res);
            return res;
          },
          (err) => {
            console.log(`Ladda: Rejected ${entity.name}.${fn.fnName} with`, err)
            return Promise.reject(err);
          }
        );
      };
    };
  };
};
```

We log during the setup process and reveal all the configuration our
plugin would have access to, log all change objects which are spawned
when Ladda's cache is updated and inform our users about each individual
api call that is made.

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
Application](https://...). This app uses a more comprehensive
implementation of the logger we just built, which can be found in the
[ladda-logger](https://github.com/ladda-js/ladda-logger) repository.
