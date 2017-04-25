# Change Listener

The returned api object of Ladda's `build` function exposes a registration function to be notified every time entities inside Ladda's cache change. The field is called `__addChangeListener`.

```javascript
import { build } from 'ladda-cache';

const config = { /* your configuration here */ };
const api = build(config);

api.__addChangeListener((change) => /* act on change */)
```

`__addChangeListener` returns an unsubscribe function to stop listening
for changes.

```javascript
const unsubscribe = api.__addChangeListener((change) => /* act on change */)
unsubscribe();
```

The signature of the change object is as follows:
```javascript
{
  type: 'UPDATE' | 'REMOVE',
  entity: EntityName,
  entities: EntityValue[]
}
```

At this point in time there is no difference made between adding new
EntityValues and updating already present ones: Both events lead to a
change of the type `UPDATE`.
The `entities` field is guaranteed to be a list of EntityValues, even if
a change only affects a single entity.


