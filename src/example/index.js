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
            datastore.Wikipedia.getSingle({id: 1}).then((x) => console.log(x));
        }, 1000);
    });
}

run();
