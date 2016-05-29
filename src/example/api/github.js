import { get } from 'axios';

getRepos.type = 'READ';
getRepos.returnsMultipleEntities = true;
export function getRepos() {
    return get('https://api.github.com/users/petercrona/repos');
}

getRepo.type = 'READ';
getRepo.returnsMultipleEntities = false;
export function getRepo(args) {
    return get('https://api.github.com/repos/petercrona/' + args.id);
}
