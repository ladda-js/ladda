import { map_, removeElement } from '../../fp';

// eslint-disable-next-line no-unused-vars
const isRelevantChange = (entity, fn, change) => true;

const createSubscriberFactory = (state, entity, fn) => () => {
  let args = [];
  let subscriptions = [];

  const changeListener = (change) => {
    if (!subscriptions.length || !isRelevantChange(entity, fn, change)) {
      return;
    }

    fn(args).then((res) => map_((subscription) => subscription(res), subscriptions));
  };

  const subscriber = {
    destroy: () => {
      subscriber.alive = false;
      state.changeListeners = removeElement(changeListener, state.changeListeners);
      subscriptions = [];
    },
    useArgs: (...nextArgs) => {
      args = nextArgs;
      return subscriber;
    },
    subscribe: (cb) => {
      subscriptions.push(cb);
      fn(args); // invoke fn, but not the cb. this will happen through the change listener
      return () => { subscriptions = removeElement(cb, subscriptions); };
    },
    alive: true
  };

  state.changeListeners.push(changeListener);
  return subscriber;
};

export const subscriber = () => ({ addListener }) => {
  const state = {
    changeListeners: []
  };

  addListener((change) => map_((c) => c(change), state.changeListeners));

  return ({ entity, fn }) => {
    if (fn.operation !== 'READ') { return fn; }
    fn.createSubscriber = createSubscriberFactory(state, entity, fn);
    return fn;
  };
};

