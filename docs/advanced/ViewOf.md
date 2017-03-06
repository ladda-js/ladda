# Views
As more and more people use wireless connections with limited data plans, we need to care about what we send over the wire. A common solution to this is to send only what the user needs. For example, if we are listing a 1000 users, we can save quite many KBs by sending only what is needed rather than a full-blown user.

However, if it means that we need to refetch the users all the time, we didn't gain much. Let's call the representation shown when listing 1000 users for `MiniUser`. And let's call the full-blown user for `User`. If MiniUser shows the name of a user, and we update the name on a User, then we would normally need to invalidate the MiniUser or manually update the name of the MiniUser corresponding to the User. Either we make our code more complicated, or we need to send more bytes over the wire than necessary.

Ladda allows you to specify that an entity is a view of another entitiy. For our example, it would look like:

```javascript
const config = {
    user: {
        api: userApi
    },
    miniUser: {
        api: miniUserApi,
        viewOf: 'user'
    }
};
```

Now, if you update a miniUser, the corresponding user will be updated and vice versa. Same goes for delete and read. If you read a new User, the miniUser will automatically use it (since it is newer than the miniUser). If you delete a User, it will be removed from both the miniUser and user. You get all this for free, by simply telling Ladda that the entity is a view of another.

## One Rule
In order for this to work, there's one strong rule. The view must be a subset of the entitiy of which it is a view. This means that all properties on the view must also exist on the other entitiy. For example: 

`User { id, name, email, dateOfBith, phoneNumber, gender }`

`MiniUser {id, name}`

works just fine. But

`User { id, name, email, dateOfBith, phoneNumber, gender }`

`MiniUser {id, name, nickname}`

will not work. Since nickname only exists in MiniUser and not User.

## One Caveat
In order to save memory and increase performance, Ladda will always prefer the real entitiy if it exists. This means that if you ask for MiniUsers you can get Users. Since MiniUser is a subset of User, this should not be a problem. But, you can't for example iterate over the keys of a MiniUser, since the keys might vary depending on if Ladda had a newer User or MiniUser. The only assumption you can make is that you will get *at least* the properties that constitute a MiniUser.
