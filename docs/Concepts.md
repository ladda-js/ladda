# Concepts

Please consider this a glossary, it introduces concepts that are important in Ladda and will help you to better understand the documentation and code.

* **ID**: Unique identifier for a EntitiyValue. By default assumed to be the property "id" of an object. But can be overriden (see Ladda Config).

* **Entity**: An Entitiy is an object with a specified set of keys and values they store. For instance, User can be an entitiy specified as *user { id, name, email, phoneNumber }*. MiniUser can be another entitiy, specified as *miniUser { id, name }*.

* **EntitiyName**: For example "user". Used to reference entities (see Entitiy definition).

* **EntitiyConfig**: Configuration of an entity.

* **Api**: Registered in the EntitiyConfig. Technically it is an object with keys corresponding to function names and values to ApiFunctions.

* **ApiFunction**: A function returning a Promise and that is part of an Api.

* **EntityValue**: An object fullfilling the specification of an Entity. This is the main type used and required for all the advanced features of Ladda. Eg. *{ id, name, email, phoneNumber}* which is the EntitityValue for the entitiy user (specified in the Entitiy definition).

* **BlobValue**: Can be either a list, an object or just a single value. Differs from EntitiyValue in that no ID exists. You use this type by specifying `yourFunction.idFrom = 'ARGS'`. The arguments with which you called the ApiFunction will be used to create an ID.
