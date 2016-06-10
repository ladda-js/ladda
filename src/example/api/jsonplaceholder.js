import { get, post } from 'axios';

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

savePosts.type = 'WRITE';
savePosts.entity = 'JsonPlacerholderPost';
savePosts.multipleEntities = true;
export function savePosts(entity) {
    return post('http://jsonplaceholder.typicode.com/posts/', { ...entity });
}
