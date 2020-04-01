import {identity} from '../../fp';

export const createApiFunction = (fn, config = {}) => {
  const fnCopy = fn.bind(null);
  fnCopy.operation = config.operation || 'NO_OPERATION';
  fnCopy.invalidates = config.invalidates || [];
  fnCopy.idFrom = config.idFrom || 'ENTITY';
  fnCopy.byId = config.byId || false;
  fnCopy.byIds = config.byIds || false;
  return fnCopy;
};

export const createEntityConfig = (config) => {
  return {
    ttl: 300,
    invalidates: [],
    invalidatesOn: ['CREATE', 'UPDATE', 'DELETE'],
    ...config
  };
};

export const createSampleConfig = () => {
  return [
    createEntityConfig({
      name: 'user',
      api: {
        getUsers: createApiFunction(identity, {operation: 'READ'}),
        getUsers2: createApiFunction(identity, {operation: 'READ'}),
        deleteUser: createApiFunction(identity, {operation: 'DELETE'})
      },
      invalidates: ['user'],
      invalidatesOn: ['READ']
    }),
    createEntityConfig({
      name: 'userPreview',
      api: {
        getPreviews: createApiFunction(identity, {operation: 'READ'}),
        updatePreview: createApiFunction(identity, {operation: 'UPDATE'})
      },
      viewOf: 'user'
    }),
    createEntityConfig({
      name: 'cars',
      ttl: 200,
      api: {
        getCars: createApiFunction(identity, {operation: 'READ'}),
        updateCar: createApiFunction(identity, {operation: 'UPDATE'})
      },
      viewOf: 'user',
      invalidates: ['user']
    }),
    createEntityConfig({
      name: 'bikes',
      ttl: 200,
      api: {
        getCars: createApiFunction(identity, {operation: 'READ'}),
        updateCar: createApiFunction(identity, {operation: 'UPDATE'})
      }
    })
  ];
};
