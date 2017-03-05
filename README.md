# Ladda
Ladda is a library that helps you with caching, invalidation of caches and to handle different representations of the same data in a **performant** and **memory efficient** way. 

The main goal with Ladda is to make it easy for you to add sophisticated caching **without making your application code more complex**. Ladda will take care of logic that would otherwise increase the complexity of your application code, and it will do so in a corner outside of your application. 

You can expect a **significant performance boost** (if you didn't have any caching already) with possibly no changes to you application code. Ladda is designed to be something you can ignore once you set it up. 

When developing your application you shouldn't care about Ladda nor caching. You should just assume that backend calls are for free, that they will be cached if possible and data will be refetched if it has to. This can **simplify you application code**.

If you get bored of Ladda you can easily get rid of it. Ladda is designed to influence your application code as little as possible. We want you to get hooked, but not because of the cost of getting rid of Ladda.

# When to Use Ladda
Ladda is not meant to cover all possible use cases. To get the full power of Ladda you need to have **well-defined entities**. For example, you might have an entity User, which contains an id, name, email and contact details. Then you might have an entity ListUser, which only contains an id and a name. The important bit is that these concepts exist and that you refer to them as User and ListUser rather than "A user might have an id, name, email and contact details, but sometimes only id and name".

Of course, if you come up with creative ways of using Ladda, go ahead! You can quite easily use Ladda just as a simple cache for external calls, in which case you don't need a clear entity. But to leverge the more advanced parts, well-defined entities are necessary.

# Get Started
Check out the [guide](/docs/GettingStarted.md) for getting started. And have a look in the [examples folder](https://github.com/petercrona/ladda/tree/master/examples). 

# Gist
For a minimal example (everything in one file) that you can clone and run, check out https://github.com/petercrona/ladda-example-mini-project (code: https://github.com/petercrona/ladda-example-mini-project/blob/master/script.js).

# Contribute
Please let me know if you have any feedback. Fork the repo, create PRs and create issues! For PRs with code, don't forget to write tests.
