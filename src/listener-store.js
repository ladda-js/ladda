import { curry, map_ } from './fp';

const remove = curry((el, arr) => {
  const i = arr.indexOf(el);
  if (i !== -1) { arr.splice(i, 1); }
  return arr;
});

const addListener = curry((listeners, listener) => {
  listeners.push(listener);
  return () => remove(listener, listeners);
});

const notify = curry((listeners, change) => map_((l) => l(change), listeners));

export const createListenerStore = () => {
  const listeners = [];
  return {
    onChange: notify(listeners),
    addListener: addListener(listeners)
  };
};

