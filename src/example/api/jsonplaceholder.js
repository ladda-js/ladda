import { get, post, delete as remove } from 'axios';

getAllPosts.type = 'READ';
getAllPosts.entity = 'JsonPlacerholderPost';
getAllPosts.multipleEntities = true;
export function getAllPosts() {
    return get('http://jsonplaceholder.typicode.com/posts');
}

getAllPostsWithIdHigerThan.type = 'READ';
getAllPostsWithIdHigerThan.entity = 'JsonPlacerholderPost';
getAllPostsWithIdHigerThan.multipleEntities = true;
export function getAllPostsWithIdHigerThan(id) {
    return get('http://jsonplaceholder.typicode.com/posts').then(x => {
        return { ...x, data: x.data.filter(y => y.id > id) };
    });
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

createPost.type = 'WRITE';
createPost.entity = 'JsonPlacerholderPost';
createPost.multipleEntities = false;
export function createPost(entity) {
    return post('http://jsonplaceholder.typicode.com/posts', { ...entity });
}

savePosts.type = 'WRITE';
savePosts.entity = 'JsonPlacerholderPost';
savePosts.multipleEntities = true;
export function savePosts(entity) {
    return post('http://jsonplaceholder.typicode.com/posts/', { ...entity });
}

deletePost.type = 'DELETE';
deletePost.entity = 'JsonPlacerholderPost';
deletePost.multipleEntities = true;
export function deletePost(entity) {
    return remove('http://jsonplaceholder.typicode.com/posts', { ...entity });
}
