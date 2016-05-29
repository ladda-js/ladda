import { get } from 'axios';

getAllPosts.type = 'READ';
getAllPosts.returnsMultipleEntities = true;
export function getAllPosts() {
    return get('http://jsonplaceholder.typicode.com/posts');
}

getSingle.type = 'READ';
getSingle.returnsMultipleEntities = false;
export function getSingle(args) {
    return get('http://jsonplaceholder.typicode.com/posts/' + args.id);
}
