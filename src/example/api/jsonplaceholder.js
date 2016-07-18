import { get, post, put, delete as remove } from 'axios';

getAllPosts.operation = 'READ';
getAllPosts.plural = true;
export function getAllPosts() {
    return get('http://jsonplaceholder.typicode.com/posts').then(x => x.data);
}

getAllPostsWithIdHigerThan.operation = 'READ';
getAllPostsWithIdHigerThan.plural = true;
export function getAllPostsWithIdHigerThan(id) {
    return get('http://jsonplaceholder.typicode.com/posts').then(x => {
        return x.data.filter(y => y.id > id);
    });
}

getSingle.operation = 'READ';
getSingle.plural = false;
getSingle.byId = true;
export function getSingle(id) {
    return get('http://jsonplaceholder.typicode.com/posts/' + id).then((x) => x.data);
}

savePost.operation = 'UPDATE';
savePost.plural = false;
export function savePost(entity) {
    return put('http://jsonplaceholder.typicode.com/posts/' + entity.id, { ...entity });
}

createPost.operation = 'CREATE';
createPost.plural = false;
export function createPost(entity) {
    return post('http://jsonplaceholder.typicode.com/posts', { ...entity }).then((x)=>x.data);
}

savePosts.operation = 'UPDATE';
savePosts.plural = true;
export function savePosts(entity) {
    return post('http://jsonplaceholder.typicode.com/posts/', { ...entity });
}

deletePost.operation = 'DELETE';
deletePost.plural = true;
export function deletePost(id) {
    return remove('http://jsonplaceholder.typicode.com/posts/' + id);
}
