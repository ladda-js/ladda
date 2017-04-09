import { map_, noop, removeElement } from '../../fp';

const isChangeOfSameEntity = (entity, change) => entity.name === change.entity;

const isRelevantChange = (entityConifgs, entity, fn, change) => {
  // TODO
  // take several other reasons into account
  // - views!
  // - find unobtrusive way to play nice with denormalizer
  //
  // This could potentially also be optimized. E.g., don't notify when you
  // know that you're dealing with an item that is not relevant for you.
  // Could be found out by looking at byId and byIds annotations.
  // It's not a big deal if this is called again though for now - might
  // not be worth the additional complexity
  //
  return isChangeOfSameEntity(entity, change);
};

const createSubscriberFactory = (state, entityConfigs, entity, fn) => () => {
  let cachedArgs = [];
  let subscriptions = [];

  const changeListener = (change) => {
    if (!subscriptions.length || !isRelevantChange(entityConfigs, entity, fn, change)) {
      return;
    }

    fn(...cachedArgs).then(
      (res) => map_((subscription) => subscription.successCb(res), subscriptions),
      (err) => map_((subscription) => subscription.errorCb(err), subscriptions)
    );
  };

  const subscriber = {
    destroy: () => {
      subscriber.alive = false;
      state.changeListeners = removeElement(changeListener, state.changeListeners);
      subscriptions = [];
    },
    withArgs: (...nextArgs) => {
      cachedArgs = nextArgs;
      return subscriber;
    },
    subscribe: (successCb, errorCb = noop) => {
      const subscription = { successCb, errorCb };
      // add ourselves to the subscription list after the first initial call,
      // so that we don't consume a change we triggered ourselves.
      fn(...cachedArgs).then(
        (res) => {
          successCb(res);
          subscriptions.push(subscription);
        },
        (err) => {
          errorCb(err);
          subscriptions.push(subscription);
        }
      );
      return () => { subscriptions = removeElement(subscription, subscriptions); };
    },
    alive: true
  };

  state.changeListeners.push(changeListener);
  return subscriber;
};

export const subscriber = () => ({ addListener, entityConfigs }) => {
  const state = {
    changeListeners: []
  };

  addListener((change) => map_((c) => c(change), state.changeListeners));

  return ({ entity, fn }) => {
    if (fn.operation !== 'READ') { return fn; }
    fn.createSubscriber = createSubscriberFactory(state, entityConfigs, entity, fn);
    return fn;
  };
};

