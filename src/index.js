
export const logger = ({ disable = false, implementation: l }) => {
  return ({ addListener, entityConfigs, config }) => {
    l.log('Ladda: Setup', entityConfigs, config);
    return ({ entity, fn }) => {
      return (...args) => {
        l.log(`Ladda: Calling ${entity.name}.${fn.name} with`, args);
        return fn(...args);
      };
    };
  };
};

