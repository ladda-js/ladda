import { map_, noop, removeElement } from '../../fp';
import { analyzeEntityRelationships } from './helper';

const isChangeOfSameEntity = (entity, change) => entity.name === change.entity;
const isChangeOfView = (rel, change) => rel.views.indexOf(change.entity) !== -1;
const isChangeOfParent = (rel, change) => rel.parents.indexOf(change.entity) !== -1;
const isInvalidatedByChange = (rel, change) => rel.invalidatedBy.indexOf(change.entity) !== -1;

const isRelevantChange = (relationships, entity, fn, change) => {
  // TODO
  // - find unobtrusive way to play nice with denormalizer
  //
  // This could potentially also be optimized. E.g., don't notify when you
  // know that you're dealing with an item that is not relevant for you.
  // Could be found out by looking at byId and byIds annotations.
  // It's not a big deal if this is called again though for now - might
  // not be worth the additional complexity. Checking might also take
  // just as long as calling the cache again anyway.
  // We might however trigger an unnecessary follow up action by consumer
  // code (such as re-rendering in an UI), which is not the nicest behavior
  //
  // In general we are very aggressive here and rather have a false positive
  // before we miss out on a change.
  // Therefore all related entity changes, also considering invalidations,
  // re-trigger here.
  //
  const rel = relationships[entity.name];
  return isChangeOfSameEntity(entity, change) ||
    isChangeOfView(rel, change) ||
    isChangeOfParent(rel, change) ||
    isInvalidatedByChange(rel, change);
};

const createObservableFactory = (state, relationships, entityConfigs, entity, fn) => (...args) => {
  let subscriptions = [];

  const changeListener = (change) => {
    if (!subscriptions.length || !isRelevantChange(relationships, entity, fn, change)) {
      return;
    }

    fn(...args).then(
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
    subscribe: (successCb, errorCb = noop) => {
      const subscription = { successCb, errorCb };
      // add ourselves to the subscription list after the first initial call,
      // so that we don't consume a change we triggered ourselves.
      fn(...args).then(
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

export const observable = () => ({ addListener, entityConfigs }) => {
  const state = {
    changeListeners: []
  };

  const relationships = analyzeEntityRelationships(entityConfigs);

  addListener((change) => map_((c) => c(change), state.changeListeners));

  return ({ entity, fn }) => {
    if (fn.operation !== 'READ') { return fn; }
    fn.createObservable = createObservableFactory(state, relationships, entityConfigs, entity, fn);
    return fn;
  };
};

