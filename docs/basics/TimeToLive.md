# Time To Live

For every cache it is important to fine-tune the TTL (time to live) for every entity. Ladda uses a sensible default of **300 seconds** (5 minutes). This works quite well in most applications, it protects against stale data, but also provides a great performance boost to your application and reduces the load on your server.

It might be tempting to set the TTL to forever (a very high number). In theory, if you always invalidate your entities when you should, this would actually work and be the best option. However, you lose the self-repairing capability that a lower TTL offers. If you at some point would forget to invalidate some data, then your users would still eventually see the most recent data if the TTL for your cache is reasonably low (eg. 300 seconds). If the cache is set to forever, your users will need to refresh their browsers to get the most recent data. This, and the fact that one request every 300 seconds is already quite good, is the motivation for caching for 300 seconds by default.

## Configure TTL

A simple example of TTL being set to 60 seconds:

```javascript
const config = {
    user: {
        ttl: 60,
        api: userApi
    }
};
```
