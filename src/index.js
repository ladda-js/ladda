import { build } from './builder';
import * as JsonPlaceHolder from 'example/api/jsonplaceholder';

const config = {
    JsonPlacerholderPost: {
        ttl: 300,
        invalidates: ['JsonPlacerholderPost', 'Fisk'],
        invalidatesOn: ['DELETE', 'UPDATE', 'CREATE'],
        api: JsonPlaceHolder
    },
    Preview: {
        ttl: 300,
        viewOf: 'JsonPlacerholderPost',
        api: JsonPlaceHolder
    }
};

const api = build(config);
const promises = [api.JsonPlacerholderPost.decoratedApi[4].val({ name: 'Kalle' }),
                  api.JsonPlacerholderPost.decoratedApi[4].val({ name: 'Erik' }),
                  api.JsonPlacerholderPost.decoratedApi[4].val({ name: 'Leffe' })];

Promise.all(promises).then(() => {
    api.JsonPlacerholderPost.decoratedApi[0].val().then((x) => {
        console.log(x);
        api.JsonPlacerholderPost.decoratedApi[0].val().then((x) => {
            console.log(x);
        });
    });
    api.JsonPlacerholderPost.decoratedApi[6].val(101).catch(() => {
        api.JsonPlacerholderPost.decoratedApi[2].val(101).then((x) => {
            console.log(x);
        });
    });
});
