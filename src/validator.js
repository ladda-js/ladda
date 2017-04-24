/* eslint-disable max-len */
import { compose, map_, toPairs } from 'ladda-fp';

const warn = (logger, msg, ...args) => {
  logger.error(`Ladda Config Error: ${msg}`, ...args);
};

const OPERATIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'NO_OPERATION'];
const isOperation = (op) => OPERATIONS.indexOf(op) !== -1;
const isConfigured = (entityName, entityConfigs) => {
  return !!entityConfigs[entityName];
};

const getEntityNames = (entityConfigs) => Object.keys(entityConfigs);
const operationsAsString = () => OPERATIONS.join(', ');


const checkApiDeclaration = (logger, entityConfigs, config, entityName, entity) => {
  if (typeof entity.api !== 'object') {
    warn(logger, `No api definition found for entity ${entityName}`);
  }
};

const checkViewOf = (logger, entityConfigs, config, entityName, entity) => {
  const { viewOf } = entity;
  if (viewOf && !isConfigured(viewOf, entityConfigs)) {
    warn(logger, `The view ${viewOf} of entity ${entityName} is not configured. Use on of: `, getEntityNames(entityConfigs));
  }
};

const checkInvalidations = (logger, entityConfigs, config, entityName, entity) => {
  const { invalidates, invalidatesOn } = entity;
  map_((entityToInvalidate) => {
    if (!isConfigured(entityToInvalidate, entityConfigs)) {
      warn(logger, `Entity ${entityName} tries to invalidate ${entityToInvalidate}, which is not configured. Use one of: `, getEntityNames(entityConfigs));
    }
  }, invalidates);

  map_((operation) => {
    if (!isOperation(operation)) {
      warn(logger, `Entity ${entityName} tries to invalidate on invalid operation ${operation}. Use on of: ${operationsAsString()}`);
    }
  }, invalidatesOn);
};

const checkEntities = (logger, entityConfigs, config) => {
  const checks = [
    checkApiDeclaration,
    checkViewOf,
    checkInvalidations
  ];
  compose(
    map_(([entityName, entity]) => {
      map_((check) => check(logger, entityConfigs, config, entityName, entity), checks);
    }),
    toPairs
  )(entityConfigs);
};


export const validateConfig = (logger, entityConfigs, config) => {
  const isProduction = process.NODE_ENV === 'production' || config.useProductionBuild;
  if (isProduction) {
    return;
  }

  checkEntities(logger, entityConfigs, config);
};
