# Ladda

Ladda is a library that helps you with caching, invalidation of caches and to handle different representations of the same data in a **performant** and **memory efficient** way.

The main goal with Ladda is to make it easy for you to add sophisticated caching **without making your application code more complex**. Ladda will take care of logic that would otherwise increase the complexity of your application code, and it will do so in a corner outside of your application.

If you had no caching before, you can expect a **significant performance boost** with possibly no changes to you application code. Ladda is designed to be something you can ignore once you set it up.

When developing your application you shouldn't care about Ladda nor caching. You should just assume that backend calls are for free, that they will be cached if possible and data will be re-fetched if it has to. This can **simplify your application code**.

If you get bored of Ladda you can easily get rid of it. Ladda is designed to influence your application code as little as possible. We want you to get hooked, but not because of the cost of getting rid of Ladda.

# Demo

The easiest way to get a glimpse of what Ladda can do is checking out our [demos](/docs/Demos.md).

# Get Started

Check out the [guide](/docs/GettingStarted.md) for getting started. In addition, you can have a look in the [examples folder](https://github.com/petercrona/ladda/tree/master/examples). These are standalone examples where you only need to follow the README.md to setup the project. There is an addtional minimal example, where you can find everything in one file, that you can clone and run: Check out [ladda-example-mini-project](https://github.com/petercrona/ladda-example-mini-project) ([code](https://github.com/petercrona/ladda-example-mini-project/blob/master/script.js)).

# Documentation

The documentation gives you an [exhaustive overview of Ladda](https://petercrona.gitbooks.io/ladda/content/).

# Why Use Ladda?

The sales pitch - A bunch of things that we are proud of: Lightweight, Quality, Standalone, Low Buy-In.

## Lightweight

Ladda is a lightweight library and comes with no additional dependencies. The library has a file size of only 14 KB (minimized).

## Quality

Ladda has a high test coverage (**100%** line coverage) with tests constantly being added. And yes, we know that high test coverage is a "feel good" number, our focus is still on meaningful and good tests. It has a reasonably simple architecture and often tries to stay [tacit](https://www.youtube.com/watch?v=seVSlKazsNk&feature=youtu.be) and concise by taking inspiration from [functional programming](https://drboolean.gitbooks.io/mostly-adequate-guide/content/). We urge you to check out the [source code](https://github.com/petercrona/ladda/tree/master/src). You can help us to improve it further or just enjoy reading functional JavaScript.

## Standalone

Apart from being independent from any dependencies, Ladda is library and framework agnostic. It doesn't depend on the latest single page application framework out there. It doesn't reinvent the wheel of caching every time a new framework comes around. You can use it in your evolving application as your caching solution.

## Low Buy-In

Ladda is just a wrapper around your client-side API layer. Somewhere in your application you might have defined all your outgoing API requests. Ladda will wrap these requests and act as your client-side cache. The API requests themselves don't change, but Ladda enhances them with caching capabilities. To get rid of Ladda, you can just remove the wrapping, and your API functions return to just being themselves. We believe that it is equally important to make it easy to add Ladda to your application, as it is to make it easy to remove Ladda from your application.

## Browser Support
All the major modern browsers are supported. However, note that for old browsers, such as Internet Explorer 11, *you will need a polyfill* since Ladda is using promises.

# Contribute

Please let us know if you have any feedback. Fork the repo, create Pull Requests and Issues. Have a look into [how to contribute](/docs/Contribute.md).
