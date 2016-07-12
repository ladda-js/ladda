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
    },
    MiniPreview: {
        ttl: 300,
        viewOf: 'JsonPlacerholderPost',
        api: JsonPlaceHolder
    }
};

const api = build(config);
const p = Promise.all([
    api.JsonPlacerholderPost.getAllPosts(),
    api.MiniPreview.getAllPosts()
]);
p.then(() => api.MiniPreview.getSingle(10))
 .then(post => {
     console.log(4, post);
 })
 .then(() => api.JsonPlacerholderPost.savePost({ id: 10,
                                                 title: 'grek',
                                                 contact: { tel: 123, fax: 456 }}))
 .then(() => api.MiniPreview.getSingle(10))
 .then(post => {
     console.log(4, post);
 })
 .then(() => {
     return api.MiniPreview.savePost({ id: 10,
                                       title: 'apa',
                                       body: 'fiskare',
                                       age: 12,
                                       contact: { tel: 222, fax: 999, loc: 123},
                                       adr: { x: 1 } });
 })
 .then(() => api.JsonPlacerholderPost.getSingle(10))
 .then(post => {
     console.log(post);
 });
