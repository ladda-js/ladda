const noop = () => {};

const defaultColors = {
  success: 'green',
  info: 'orange',
  error: 'red',
  text: 'inherit',
  subText: 'gray'
};

const toFnName = (entity, fn) => `${entity.name}.${fn.name}`;

/* eslint-disable no-undef */
/* eslint-disable max-len */
const timer = (typeof performance !== 'undefined' && performance !== null) && typeof performance.now === 'function' ? performance : Date;
/* eslint-enable no-undef */
/* eslint-enable max-len */

const repeat = (str, times) => (new Array(times + 1)).join(str);
const pad = (num, maxLength) => repeat('0', maxLength - num.toString().length) + num;
const getDuration = (start) => (timer.now() - start) / 1000;
const formatTime = (time) => `${pad(time.getHours(), 2)}:${pad(time.getMinutes(), 2)}:${pad(time.getSeconds(), 2)}.${pad(time.getMilliseconds(), 3)}`;


const toTitleStyle = (color) => `color: ${color}; font-weight: bold';`;
const toTextStyle = (color) => `color: ${color}`;
const toSubTextStyle = (color) => `color: ${color}, font-weight: lighter`;

const toTimeText = (time, duration) => `@ ${formatTime(time)} (in ${duration}ms)`;

const logGroup = (impl, formattedText, titleColor, colors, collapse) => {
  const args = [
    formattedText,
    toTitleStyle(titleColor),
    toTextStyle(colors.text),
    toSubTextStyle(colors.subText)
  ];
  if (collapse) {
    impl.groupCollapsed(...args);
  } else {
    impl.group(...args);
  }
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
        const text = 'Ladda setup';
        if (collapse) {
          impl.groupCollapsed(text);
        } else {
          impl.group(text);
        }
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
        impl.log(`%c${text}`, toTitleStyle(colors.info), change);
      }
    },
    logResolve: (fnName, startTime, start, res, args) => {
      const text = 'Ladda resolved';
      const timeText = toTimeText(startTime, getDuration(start));
      if (noFormat) {
        impl.log(`${text} ${fnName} ${timeText} with`, res, 'from args', args);
      } else {
        const title = `%c${text} %c${fnName} %c@ ${timeText}`;
        logGroup(impl, title, colors.success, colors, collapse);
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
        logGroup(impl, title, colors.error, colors, collapse);
        impl.log('args', args);
        impl.log('err', err);
        impl.groupEnd();
      }
    }
  };
};


export const logger = ({
  disable = false,
  collapse = false,
  colors = defaultColors,
  implementation = console,
  noFormat = false
}) => {
  const l = createLogger(implementation, disable, collapse, colors, noFormat);

  return ({ addListener, entityConfigs, config }) => {
    addListener((change) => l.logChange(change));
    l.logSetup(entityConfigs, config);

    return ({ entity, fn }) => {
      const fnName = toFnName(entity, fn);
      return (...args) => {
        const startTime = new Date();
        const start = timer.now();
        return fn(...args).then(
          (res) => {
            l.logResolve(fnName, startTime, start, res, args);
            return res;
          },
          (err) => {
            l.logReject(fnName, startTime, start, err, args);
            return Promise.reject(err);
          }
        );
      };
    };
  };
};

