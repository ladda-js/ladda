# Concepts

Please consider this a glossary, it introduces concepts that are important in Ladda and will help you to better understand the documentation and code.

* **ID**: Unique identifier for a EntityValue. By default assumed to be the property "id" of an object. But can be overwritten (see Ladda Config).

* **Entity**: An Entity is an object with a specified set of keys and values they store. For instance, User can be an entity specified as *user { id, name, email, phoneNumber }*. MiniUser can be another entity, specified as *miniUser { id, name }*.

* **EntityName**: For example "user". Used to reference entities (see Entity definition).

* **EntityConfig**: Configuration of an entity.

* **Api**: Registered in the EntityConfig. Technically it is an object with keys corresponding to function names and values to ApiFunctions.

* **ApiFunction**: A function returning a Promise and that is part of an Api.

* **EntityValue**: An object fullfilling the specification of an Entity. This is the main type used and required for all the advanced features of Ladda. Eg. *{ id, name, email, phoneNumber}* which is the EntitityValue for the entity user (specified in the Entity definition).

* **BlobValue**: Can be either a list, an object or just a single value. Differs from EntityValue in that no ID exists. You use this type by specifying `yourFunction.idFrom = 'ARGS'`. The arguments with which you called the ApiFunction will be used to create an ID.
