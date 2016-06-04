import * as Github from './api/github';
import * as Wikipedia from './api/wikipedia';
import { createDatastore, registerApi, registerMiddleware, build } from 'datastore';
import * as Caching from 'caching';

function run() {
    let datastore = createDatastore();
    datastore = registerMiddleware('Caching', Caching, datastore);
    datastore = registerApi('Github', Github, datastore);
    datastore = registerApi('Wikipedia', Wikipedia, datastore);
    datastore = build(datastore);


    const res = datastore.Wikipedia.getAllPosts();
    res.then((x) => {
        setTimeout(() => {
            datastore.Wikipedia.savePosts([{id: 31, body: 'hej'}, {id: 1, body: 'Fisk'}]).then(() => {
                datastore.Wikipedia.getAllPosts().then((x) => console.log(4, x));
            });
        }, 5000);
    });
}

run();
