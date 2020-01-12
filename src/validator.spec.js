/* eslint-disable @typescript-eslint/no-unused-expressions */
import sinon from 'sinon';
import { validateConfig } from './validator';
import { getEntityConfigs } from './builder';

const createLogger = () => ({
  error: sinon.spy()
});

const createGlobalConfig = (conf) => ({
  idField: 'id',
  enableDeduplication: true,
  useProductionBuild: false,
  ...conf
});

describe('validateConfig', () => {
  it('does not do anything when using production build', () => {
    const logger = createLogger();
    const eConfigs = getEntityConfigs({
      user: {}
    });
    const config = createGlobalConfig({ useProductionBuild: true });

    validateConfig(logger, eConfigs, config);
    expect(logger.error).not.to.have.been.called;
  });

  it('does not do anything when invalid logger is passed', () => {
    const invalidLogger = { x: sinon.spy() };

    const eConfigs = getEntityConfigs({
      user: {}
    });
    const config = createGlobalConfig({ useProductionBuild: true });

    validateConfig(invalidLogger, eConfigs, config);
    expect(invalidLogger.x).not.to.have.been.called;
  });

  it('checks the global config object - idField', () => {
    const logger = createLogger();

    const eConfigs = getEntityConfigs({
      user: {
        api: {
          getAll: () => {}
        }
      }
    });
    const config = createGlobalConfig({ idField: true });

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/idField.*string.*was.*boolean/);
  });

  it('checks the global config object - enableDeduplication', () => {
    const logger = createLogger();

    const eConfigs = getEntityConfigs({
      user: {
        api: {
          getAll: () => {}
        }
      }
    });
    const config = createGlobalConfig({ enableDeduplication: 'X' });

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/enableDeduplication.*boolean.*was.*string/);
  });

  it('checks for missing api declarations', () => {
    const logger = createLogger();

    const eConfigs = getEntityConfigs({
      user: {
        api: {
          getAll: () => {}
        }
      },
      activity: {}
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/No api definition.*activity/);
  });

  it('checks for non-configured views', () => {
    const logger = createLogger();

    const eConfigs = getEntityConfigs({
      user: {
        api: {
          getAll: () => {}
        }
      },
      mediumUser: {
        api: {
          getAll: () => {}
        },
        viewOf: 'user'
      },
      miniUser: {
        api: {
          getAll: () => {}
        },
        viewOf: 'mdiumUser' // typo!
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/mdiumUser.*miniUser.*not configured/);
  });

  it('checks for wrong invalidation targets', () => {
    const logger = createLogger();

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll: () => {} },
        invalidates: ['activity', 'ntification'] // typo!
      },
      activity: {
        api: { getAll: () => {} },
        viewOf: 'user'
      },
      notification: {
        api: { getAll: () => {} },
        invalidates: ['activity']
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/user.*invalidate.*ntification.*not configured/);
  });

  it('checks for wrong invalidation operations', () => {
    const logger = createLogger();

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll: () => {} }
      },
      activity: {
        api: { getAll: () => {} },
        viewOf: 'user'
      },
      notification: {
        api: { getAll: () => {} },
        invalidates: ['activity'],
        invalidatesOn: ['X']
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/notification.*invalid operation.*X/);
  });

  it('checks for wrong ttl values', () => {
    const logger = createLogger();

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll: () => {} },
        ttl: 300
      },
      activity: {
        api: { getAll: () => {} },
        ttl: 'xxx'
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/activity.*ttl.*string.*needs to be a number/);
  });

  it('checks for wrong enableDeduplication value', () => {
    const logger = createLogger();

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll: () => {} },
        enableDeduplication: true
      },
      activity: {
        api: { getAll: () => {} },
        enableDeduplication: 'X'
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(
      /activity.*enableDeduplication.*string.*needs to be a boolean/
    );
  });


  it('checks for wrong api operations', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'X';

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll }
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/user.getAll.*operation.*X/);
  });

  it('checks for wrong api byId field', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'READ';
    getAll.byId = 'xxx';

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll }
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/user.getAll.*byId.*string/);
  });

  it('checks for wrong api byIds field', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'READ';
    getAll.byIds = 'xxx';

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll }
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/user.getAll.*byIds.*string/);
  });

  it('checks for wrong api enableDeduplication definition', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'READ';
    getAll.enableDeduplication = 'X';

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll }
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/user.getAll.*enableDeduplication.*string/);
  });

  it('checks for wrong api idFrom (illegal type)', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'READ';
    getAll.idFrom = true;

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll }
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/user.getAll.*idFrom/);
  });

  it('checks for wrong api idFrom (illegal string)', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'READ';
    getAll.idFrom = 'X';

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll }
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/user.getAll.*idFrom/);
  });

  it('checks for wrong api invalidates definition', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'READ';
    getAll.invalidates = ['getOne', 'getSme']; // typo!

    const getOne = () => {};
    getOne.operation = 'READ';

    const getSome = () => {};
    getSome.operation = 'READ';

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll, getSome, getOne }
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/user.getAll.*invalidate.*getSme/);
  });

  it('checks for correct operation', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'RAD';

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll }
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.calledOnce;
    expect(logger.error.args[0][0]).to.match(/user.getAll.*operation is RAD.*use one of/);
  });

  it('informs about several errors', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'READ';
    getAll.idFrom = 'X';

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll },
        invalidates: ['X']
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.calledTwice;
  });

  it('happily accepts valid configurations', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'READ';
    getAll.idFrom = 'ENTITY';

    const createUser = () => {};
    createUser.operation = 'CREATE';

    const updateUser = () => {};
    updateUser.operation = 'UPDATE';

    const deleteUser = () => {};
    deleteUser.operation = 'DELETE';

    const commandForUser = () => {};
    commandForUser.operation = 'COMMAND';

    const noopUser = () => {};
    noopUser.operation = 'NO_OPERATION';

    const eConfigs = getEntityConfigs({
      user: {
        api: {
          getAll, createUser, updateUser, deleteUser, commandForUser, noopUser
        },
        invalidates: ['activity']
      },
      activity: {
        api: { getAll: () => {} },
        ttl: 400
      }
    });
    const config = createGlobalConfig({});

    validateConfig(logger, eConfigs, config);
    expect(logger.error).not.to.have.been.called;
  });
});
