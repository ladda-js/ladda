import {
  ApiFunction, ApiFunctionConfig, Entity, EntityConfigs, Plugin, PluginDecorator
} from '../../types';
import { Change, ChangeHandler } from '../cache';
import { analyzeEntityRelationships, Container, Relationships } from './helper';

const isNoOperation = (change:Change) => change.operation === 'NO_OPERATION';
const isChangeOfSameEntity = (entity: Entity, change: Change) => {
  return !isNoOperation(change) && entity.name === change.entity;
};
const isChangeOfView = (rel: Container, change: Change) => {
  return !isNoOperation(change) && rel.views.indexOf(change.entity) !== -1;
};
const isChangeOfParent = (rel: Container, change: Change) => {
  return !isNoOperation(change) && rel.parents.indexOf(change.entity) !== -1;
};
const isInvalidatedByChange = (rel: Container, change: Change) => {
  return rel.invalidatedBy.indexOf(change.entity) !== -1;
};
const isInvalidatedByFunction = (entity: Entity, fn: ApiFunctionConfig, change: Change) => {
  if (change.entity !== entity.name) {
    return false;
  }
  const invalidations = entity.api[change.apiFn].invalidates!; // TODO invalidates should have been initialized to empty array in setEntityConfigDefaults
  return Boolean(invalidations.length) && invalidations.indexOf(fn.fnName!) !== -1; // TODO fnName should have been initialized by setApiConfigDefaults
};

const isRelevantChange = (
  relationships: Relationships,
  entity: Entity,
  fn: ApiFunctionConfig,
  change: Change
) => {
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
  return isChangeOfSameEntity(entity, change)
    || isChangeOfView(rel, change)
    || isChangeOfParent(rel, change)
    || isInvalidatedByChange(rel, change)
    || isInvalidatedByFunction(entity, fn, change);
};

interface Subscription<R> {
  onNext(res: R): void
  onError(err: Error): void
}

interface State {
  changeListeners: ChangeHandler[]
}

const createObservableFactory = <R, A extends any[]>(
  state: State,
  relationships: Relationships,
  entityConfigs: EntityConfigs,
  entity: Entity,
  fn: ApiFunction<R, A>
) => (...args: A) => {
    let subscriptions: Subscription<R>[] = [];

    const changeListener = (change: Change) => {
      if (!isRelevantChange(relationships, entity, fn, change)) {
        return;
      }

      fn(...args).then(
        (res) => subscriptions.map((subscription) => subscription.onNext(res)),
        (err) => subscriptions.map((subscription) => subscription.onError(err))
      );
    };

    const addSubscription = (subscription: Subscription<R>) => {
      if (subscriptions.length === 0) {
        state.changeListeners.push(changeListener);
      }
      subscriptions.push(subscription);
    };

    const removeSubscription = (subscription: Subscription<R>) => {
      subscriptions = subscriptions.filter(s => s !== subscription);
      if (subscriptions.length === 0) {
        state.changeListeners = state.changeListeners.filter(l => l !== changeListener);
      }
    };


    const observable:Observable<R> = {
      subscribe: (onNext, onError = () => {}) => {
        const subscription: Subscription<R> = { onNext, onError };
        // add ourselves to the subscription list after the first initial call,
        // so that we don't consume a change we triggered ourselves.
        fn(...args).then(
          (res) => {
            onNext(res);
            addSubscription(subscription);
          },
          (err) => {
            onError(err);
            addSubscription(subscription);
          }
        );
        return { unsubscribe: () => { removeSubscription(subscription); } };
      }
    };

    return observable;
  };

interface Observable<R> {
  subscribe(onNext: (res: R)=>void, onError: (err: Error) => void): {
    unsubscribe():void
  }
}

type DecoratedApiFunction<R, A extends any[]> = ApiFunction<R, A> & {
  createObservable: (...args: A) => Observable<R>
};

const observable = ():Plugin => {
  return ({ addChangeListener, entityConfigs }) => {
    const state: State = {
      changeListeners: []
    };

    const relationships = analyzeEntityRelationships(entityConfigs);

    addChangeListener((change: Change) => state.changeListeners.map(listener => listener(change)));

    return (<R, A extends any[]>(
      { entity, fn }: {
        entity: Entity,
        fn: DecoratedApiFunction<R, A>
      }) => {
      if (fn.operation !== 'READ') { return fn; }
      fn.createObservable = createObservableFactory<R, A>(
        state,
        relationships,
        entityConfigs,
        entity,
        fn
      );
      return fn;
    }) as PluginDecorator;
  };
};

export default observable;
