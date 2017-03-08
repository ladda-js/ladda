# Advanced

We believe that the basics is enough to make Ladda useful for you. But as you create more and more entities you will need to model dependencies between these. For example, posting a message might need to invalidate the cache of an activity stream. You might also try to reduce the amount of data going over the wire by introducing smaller representations of entities, eg. a MiniUser which is a User but only with {id, name}. In the advanced topics we go through how Ladda can help you out in these and other cases.
