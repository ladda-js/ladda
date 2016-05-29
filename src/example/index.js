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

    const res = datastore.Github.getRepos();
    res.then((x) => {
        setTimeout(() => {
            datastore.Github.getRepos().then((x) => console.log(x));
        }, 1000);
        setTimeout(() => {
            datastore.Github.getRepo({id: 1379780}).then((x) => console.log(x));
        }, 500);
    });
}

run();
