import * as datastore from './datastore';
import Caching from './caching';

module.exports = {
    ...datastore,
    middleware: {
        Caching
    }
};
