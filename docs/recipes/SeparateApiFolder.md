# Separate API Folder

For many people one of the big benefits of using Ladda is in fact not related to Ladda itself. Something that we believe in is a layered architecture where the API is a separate layer. In essence, this means that there's one place, eg. one folder, where all API-requests are performed. Your application structure might look like:

```
- src
-- pages
-- components
-- services
-- api
```

By putting the client-side API-layer in a separate folder you can easily move it with you as you switch framework. And it's just nice to keep one of your application's boundaries clearly separated. It also means that Ladda can easily be added and, if you chose to, removed from your application. A common setup for Ladda is:

```
- src
-- api
--- index.js
--- user.js
--- mini-user.js
```

where you put your configuration in `index.js` and define your ApiFunctions in the other files named after the entities they are for. It might look like:

*index.js*:
```javascript
import * as userApi from './user';
import * as miniUserApi from './mini-user';
import { build } from 'ladda-cache';

const config = {
    user: {
        api: userApi
    },
    miniUser: {
        api: miniUserApi,
        viewOf: 'user'
    }
};

export default build(config);
```

*user.js*:
```javascript
getUsers.operation = 'READ';
export function getUsers() {
    return get('/users');
}
```

*mini-user.js*:
```javascript
getMiniUsers.operation = 'READ';
export function getMiniUsers() {
    return get('/mini-users');
}
```

Your application code will now use Ladda as:

```javascript
import api from 'api';

api.miniUser.getMiniUsers().then(miniUsers => console.log(miniUsers);
api.user.getUsers().then(users => console.log(users));
```

If you would like to remove Ladda, you would simply update your `api/index.js` as:

```javascript
import * as user from './user';
import * as miniUser from './mini-user';

return {
    user,
    miniUser
};
```

And enjoy your still operating application (without having a cache).
