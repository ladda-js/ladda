# Concepts

Please consider this a glossary, it introduces concepts that are important in Ladda and will help you to better understand the documentation.

* ID: Unique identifier for a EntitiyValue. By default assumed to be the property "id" of an object. But can be overriden (see Ladda Config).

* EntitiyName: The key in the main Ladda configuration that is passed to "build".

* EntitiyConfig: Configuration of an entity in the main Ladda configuration.

* ApiFunction: A function returning a Promise and is registerd in the EntitiyConfig.

* EntityValue: An object with an ID. This is the main type used and required for all the advanced features of Ladda. For a lot of users this is the only type they need to care about.

* BlobValue: Can be either a list, an object or just a single value. Differs from EntitiyValue in that no ID exists. You use this type by specifying `yourFunction.idFrom = 'ARGS'`. The arguments with which you called the ApiFunction will be used to create an ID.
