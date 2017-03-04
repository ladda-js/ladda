# Configuration
Most options are optional. Typically you need to specify at least "api" on the entity and "operation" on the method. 

## Entity Configuration
* **ttl**: How long to cache in seconds. Default is `300` seconds.

* **invalidatesOn**: `[Operation]` where `Operation := "CREATE" | "READ" | "UPDATE" | "DELETE" | "NO_OPERATION"`. Default is `["CREATE", "UPDATE", "DELETE"]`.

* **invalidates**: `[EntityName]` where EntitiyName is the key of your EntitiyConfig. By default an empty list `[]`.

* **viewOf**: `EntitiyName`. Only specify if this is a subset for another entitiy (all fields must exist in the other entity).

* **api** (required): An object of ApiFunctions, functions that communciate with an external service and return a Promise. The function name as key and function as value.

## Method Configuration
* **operation**: `"CREATE" | "READ" | "UPDATE" | "DELETE" | "NO_OPERATION"`. Default is `"NO_OPERATION"`.

* **invalidates**: `[ApiFunctionName]` where ApiFunctionName is a name of another function in the same api (see Entitiy Configuration - api). By default this is the empty list `[]`.

* **idFrom**: `"ENTITY" | "ARGS" | Function`. Where `"ARGS"` is a string telling Ladda to generate an id for you by serializing the ARGS the ApiFunction is called with. "ARGS" will also tell Ladda to treat the value as a BlobValue. Function is a function `(EntitiyValue -> ID)`. By default "ENTITY".

* **byId**: `true | false`. This is an optimization that tells Ladda that the first argument is an id. This allows Ladda to directly try to fetch the data from the cache, even if it was acquired by another call. This is useful if you previously called for example "getAllUsers" and now want to fetch one user directly from the cache. By default false.


## Ladda Configuration
* **idField**: Specify the default property that contains the ID. By default this is `"id"`.
