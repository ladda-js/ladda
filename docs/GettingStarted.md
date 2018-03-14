# Getting Started

Do a `npm install ladda-cache --save` in your project. Now, to use Ladda you need to configure it and export an API built from the configuration. Create a file "api/index.js":

```javascript
import * as projectApi from './project';
import { build } from 'ladda-cache';

const config = {
    project: {
        api: projectApi
    }
};

export default build(config);
```

where project is a bunch of api-methods (living in /api/project.js) returning promises, it might look like:

```javascript
getProjectsCreatedAfter.operation = 'READ';
export function getProjectsCreatedAfter(date) {
    return get(resource, {date}); // Returns a promise containing a list of projects (where each project has an ID)
}
```

where `get` is a function performing a HTTP-requests and returning a promise. You will need to create an API for your own application using your own method for creating get requests (for example [Axios](https://github.com/axios/axios)). When you call `getProjectsCreatedAfter` the results will be cached. So if you call it more than once within 300s (default time to life for the cache), only one HTTP-request will be made per date. Just don't forget that each project must have an ID, by default in a property "id" (eg. project.id).

For a very concise and self-contained example, check out [this minimal example](https://github.com/petercrona/ladda-example-mini-project/blob/master/script.js).
