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
});
