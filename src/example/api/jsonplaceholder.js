import { get, post } from 'axios';

getAllPosts.type = 'READ';
getAllPosts.entity = 'JsonPlacerholderPost';
getAllPosts.multipleEntities = true;
export function getAllPosts() {
    return get('http://jsonplaceholder.typicode.com/posts');
}

getSingle.type = 'READ';
getSingle.entity = 'JsonPlacerholderPost';
getSingle.multipleEntities = false;
export function getSingle(args) {
    return get('http://jsonplaceholder.typicode.com/posts/' + args.id);
}

savePost.type = 'WRITE';
savePost.entity = 'JsonPlacerholderPost';
savePost.multipleEntities = false;
export function savePost(entity) {
    return post('http://jsonplaceholder.typicode.com/posts/' + entity.id, { ...entity });
}

savePosts.type = 'WRITE';
savePosts.entity = 'JsonPlacerholderPost';
savePosts.multipleEntities = true;
export function savePosts(entity) {
    return post('http://jsonplaceholder.typicode.com/posts/', { ...entity });
}
