import { get, post } from 'axios';

getAllPosts.type = 'READ';
getAllPosts.entity = 'WikipediaPost';
getAllPosts.multipleEntities = true;
export function getAllPosts() {
    return get('http://jsonplaceholder.typicode.com/posts');
}

getSingle.type = 'READ';
getSingle.entity = 'WikipediaPost';
getSingle.multipleEntities = false;
export function getSingle(args) {
    return get('http://jsonplaceholder.typicode.com/posts/' + args.id);
}

savePost.type = 'WRITE';
savePost.entity = 'WikipediaPost';
savePost.multipleEntities = false;
export function savePost(entity) {
    return post('http://jsonplaceholder.typicode.com/posts/' + entity.id, { ...entity });
}

savePosts.type = 'WRITE';
savePosts.entity = 'WikipediaPost';
savePosts.multipleEntities = true;
export function savePosts(entity) {
    return post('http://jsonplaceholder.typicode.com/posts/', { ...entity });
}
