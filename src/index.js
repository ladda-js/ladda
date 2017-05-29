const noop = () => {};

const defaultColors = {
  success: 'green',
  info: 'orange',
  error: 'red',
  text: 'inherit',
  subText: 'gray'
};

const toFnName = (entity, fn) => `${entity.name}.${fn.fnName}`;

/* eslint-disable no-undef */
/* eslint-disable max-len */
const timer = (typeof performance !== 'undefined' && performance !== null) && typeof performance.now === 'function' ? performance : Date;
/* eslint-enable no-undef */
/* eslint-enable max-len */

const round = (value, decimals) => {
  const rounded = Math.round(`${value}e${decimals}`);
  return Number(`${rounded}e-${decimals}`);
};

const getDuration = (start) => round((timer.now() - start) / 1000, 3);

const inBoldStyle = (color) => `color: ${color}; font-weight: bold;`;

const toTimeText = (duration) => `in ${duration}ms`;

const logGroup = (impl, collapse, ...args) => {
  if (collapse) {
    impl.groupCollapsed(...args);
  } else {
    impl.group(...args);
  }
};

const logResult = (impl, formattedText, titleColor, colors, collapse) => {
  const args = [
    formattedText,
    inBoldStyle(colors.subText),
    inBoldStyle(titleColor),
    inBoldStyle(colors.subText)
  ];
  logGroup(impl, collapse, ...args);
};

const createLogger = (impl, disabled, collapse, colors, noFormat) => {
  if (disabled) {
    return {
      logChange: noop,
      logSetup: noop,
      logResolve: noop,
      logReject: noop
    };
  }
  return {
    logSetup: (entityConfigs, config) => {
      if (noFormat) {
        impl.log('Ladda setup with entityConfigs', entityConfigs, 'and global config', config);
      } else {
        logGroup(impl, collapse, 'Ladda setup running');
        impl.log('entity configs', entityConfigs);
        impl.log('global config', config);
        impl.groupEnd();
      }
    },
    logChange: (change) => {
      const text = 'Ladda cache change';
      if (noFormat) {
        impl.log(text, change);
      } else {
        const args = [
          `%c${text} %c${change.operation} ${change.entity} by ${change.apiFn}`,
          inBoldStyle(colors.subText),
          inBoldStyle(colors.info)
        ];
        logGroup(impl, collapse, ...args);
        impl.log('args', change.args);
        impl.log('values', change.values);
        impl.groupEnd();
      }
    },
    logResolve: (fnName, start, res, args) => {
      const text = 'Ladda resolved';
      const timeText = toTimeText(getDuration(start));
      if (noFormat) {
        impl.log(`${text} ${fnName} ${timeText} with`, res, 'from args', args);
      } else {
        const title = `%c${text} %c${fnName} %c${timeText}`;
        logResult(impl, title, colors.success, colors, collapse);
        impl.log('args', args);
        impl.log('res', res);
        impl.groupEnd();
      }
    },
    logReject: (fnName, startTime, start, err, args) => {
      const text = 'Ladda rejected';
      const timeText = toTimeText(startTime, getDuration(start));
      if (noFormat) {
        impl.log(`${text} ${fnName} ${timeText} with err`, err, 'from args', args);
      } else {
        const title = `%c${text} %c${fnName} %c@ ${timeText}`;
        logResult(impl, title, colors.error, colors, collapse);
        impl.log('args', args);
        impl.log('err', err);
        impl.groupEnd();
      }
    }
  };
};


export const logger = ({
  disable = false,
  collapse = true,
  colors = defaultColors,
  implementation = console,
  noFormat = false
} = {}) => {
  const l = createLogger(implementation, disable, collapse, colors, noFormat);

  return ({ addChangeListener, entityConfigs, config }) => {
    addChangeListener((change) => l.logChange(change));
    l.logSetup(entityConfigs, config);


    return ({ entity, fn }) => {
      const fnName = toFnName(entity, fn);
      return (...args) => {
        const start = timer.now();
        return fn(...args).then(
          (res) => {
            l.logResolve(fnName, start, res, args);
            return res;
          },
          (err) => {
            l.logReject(fnName, start, err, args);
            return Promise.reject(err);
          }
        );
      };
    };
  };
};

