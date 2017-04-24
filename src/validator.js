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

const checkApiDeclaration = (logger, entityConfigs, config, entityName, entity) => {
  if (typeof entity.api !== 'object') {
    warn(logger, `No api definition found for entity ${entityName}`);
    return;
  }
  const warnApi = (msg, ...args) => {
    return warn(logger, `Invalid api config. ${msg}`, ...args);
  };

  const apiNames = Object.keys(entity.api);

  compose(
    // eslint-disable-next-line no-unused-vars
    map_(([fnName, fn]) => {
      const { operation, invalidates, idFrom, byId, byIds } = fn;
      const fullName = `${entityName}.${fnName}`;
      if (!isOperation(operation)) {
        warnApi(`${fullName}'s operation is ${operation}, use one of: `, OPERATIONS);
      }

      if (typeof byId !== 'boolean') {
        warnApi(`${fullName}'s byId needs to be a boolean, was ${typeof byId}'`);
      }

      if (typeof byIds !== 'boolean') {
        warnApi(`${fullName}'s byIds needs to be a boolean, was ${typeof byIds}'`);
      }

      if (typeof idFrom !== 'function') {
        if (typeof idFrom !== 'string' || ['ENTITY', 'ARGS'].indexOf(idFrom) === -1) {
          warnApi(`${fullName} defines illegal idFrom. Use 'ENTITY', 'ARGS', or a function (Entity => id)`);
        }
      }

      map_((fnToInvalidate) => {
        if (typeof entity.api[fnToInvalidate] !== 'function') {
          warnApi(`${fullName} tries to invalidate ${fnToInvalidate}, which is not a function. Use on of: `, apiNames);
        }
      }, invalidates);
    }),
    toPairs
  )(entity.api);
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
      warn(logger, `Entity ${entityName} tries to invalidate on invalid operation ${operation}. Use on of: `, OPERATIONS);
    }
  }, invalidatesOn);
};

const checkTTL = (logger, entityConfigs, config, entityName, entity) => {
  if (typeof entity.ttl !== 'number') {
    warn(logger, `Entity ${entityName} specified ttl as type of ${typeof entity.ttl}, needs to be a number in seconds`);
  }
};

const checkEntities = (logger, entityConfigs, config) => {
  const checks = [
    checkApiDeclaration,
    checkViewOf,
    checkInvalidations,
    checkTTL
  ];
  compose(
    map_(([entityName, entity]) => {
      map_((check) => check(logger, entityConfigs, config, entityName, entity), checks);
    }),
    toPairs
  )(entityConfigs);
};


export const validateConfig = (logger, entityConfigs, config) => {
  // do not remove the process.NODE_ENV check here - allows uglifiers
  // to optimize and remove all unreachable code.
  if (process.NODE_ENV === 'production' || config.useProductionBuild) {
    return;
  }

  checkEntities(logger, entityConfigs, config);
};
