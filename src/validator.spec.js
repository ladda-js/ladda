/* eslint-disable no-unused-expressions */
import sinon from 'sinon';
import { validateConfig } from './validator';
import { getEntityConfigs } from './builder';

const createLogger = () => ({
  error: sinon.spy()
});

describe('validateConfig', () => {
  it('does not do anything when using production build', () => {
    const logger = createLogger();
    const eConfigs = getEntityConfigs({
      user: {}
    });
    const config = { useProductionBuild: true };

    validateConfig(logger, eConfigs, config);
    expect(logger.error).not.to.have.been.called;
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
    const config = {};

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
    const config = {};

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
    const config = {};

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
    const config = {};

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
    const config = {};

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/activity.*ttl.*string.*needs to be a number/);
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
    const config = {};

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
    const config = {};

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
    const config = {};

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/user.getAll.*byIds.*string/);
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
    const config = {};

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
    const config = {};

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
    const config = {};

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.called;
    expect(logger.error.args[0][0]).to.match(/user.getAll.*invalidate.*getSme/);
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
    const config = {};

    validateConfig(logger, eConfigs, config);
    expect(logger.error).to.have.been.calledTwice;
  });

  it('happily accepts valid configurations', () => {
    const logger = createLogger();

    const getAll = () => {};
    getAll.operation = 'READ';
    getAll.idFrom = 'ENTITY';

    const eConfigs = getEntityConfigs({
      user: {
        api: { getAll },
        invalidates: ['activity']
      },
      activity: {
        api: { getAll: () => {} },
        ttl: 400
      }
    });
    const config = {};

    validateConfig(logger, eConfigs, config);
    expect(logger.error).not.to.have.been.calledTwice;
  });
});
