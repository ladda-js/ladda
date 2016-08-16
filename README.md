# Ladda
JavaScript data fetching layer with caching.

# Background
When building a SPA, for example with React or Angular, you eventually need to have some kind of client side caching. You want stuff to be instant, but as the number of users increase the performance decline and your application's complexity increase because of all ad-hoc caching you start to add here and there. There are plenty of solutions out there, but typically they are very ambitious and pollute your application code with complexity. Ladda tries to keep things simple by moving data fetching, and especially caching, into a separate layer. **The goal is that you fetch your data everytime you want it**. Say that you have a user profile page which contains, really expensive to fetch, messages about the user. By far more than I would have liked to, I have seen "if (inCache(...)) { ... } else { ... }". Gone are those sights. With Ladda you fetch your data everytime you want it. Either it comes from the cache or from a HTTP request. You don't have to care, you can just sit back and see the server load decline as well as your app magically become faster.

# Get Started
To use Ladda you need to configure it and export a API built from the configuration. You might create a file "api/index.js":

```javascript
import * as project from './project';
import { build } from 'ladda-cache';

const config = {
    projects: {
        ttl: 300,
        invalidates: ['projects', 'projectPreview'],
        invalidatesOn: ['CREATE'],
        api: project
    }
};

export default build(config);
```

where project is a bunch of api-methods returning promises, eg:

```javascript
createProject.operation = 'CREATE';
createProject.plural = false;
createProject.invalidates = ['getProjects(*)'];
export function createProject(project) {
    return post(resource, { postData: project });
}

getProjects.operation = 'READ';
getProjects.plural = true;
export function getProjects(foo) {
    return get(resource);
}
```

# Api Function Annotations
  As you can see above we are adding information directly on the function object. Functions can be configured using:

  * alwaysGetFreshData : <default: false> : Always fetch data and save in cache
  * plural : <required> : Used when operation is set to READ. Informs Ladda that a list of multiple entities is expected.
  * invalidates : <default: []> : Invalidates the query cache for the specified api function in the same type. If suffixed with (*) query cache regardless of query will be cleared. Otherwise only api function called without parameters.
  * operation : <required> : CREATE | READ | UPDATE | DELETE - necessary for Ladda to handle caching correclty.

# Entity Config
  For Ladda to work optimally you need to specify the relationship between entities and other caching settings.

  * viewOf : null : Specifies that the current entity is a view of another entity. The super entity will influence the cache of the view and vice versa. Eg. if a UserPreview is a view of User, then updating a user's name calling User.updateName({ id, name }) will update UserPreview.name and vice versa.
  * ttl : 300 : How long the cache is valid in seconds. After the number of seconds specified Ladda will pretend the cached entity don't exist.
  * invalidates : [] : Other entities to invalidate on operations specified in "invalidatesOn"
  * invalidatesOn : [CREATE] : Operations to invalidate on, where operations can be CREATE, READ, UPDATE, DELETE.

# Try it out
Do a "npm install ladda-cache" in your project. Stay tuned for an example project.
