import { Operation } from './types';

export interface Change {
  operation: Operation,
  entity: string,
  apiFn: string,
  values: any[],
  args: any[]
}

export interface ChangeListener {
  (change: Change):void
}

export interface ListenerStore {
  onChange: ChangeListener
  addChangeListener(listener: ChangeListener): () => ChangeListener[]
}

const remove = <T>(el:T, arr:T[]) => {
  const i = arr.indexOf(el);
  if (i !== -1) { arr.splice(i, 1); }
  return arr;
};

const addChangeListener = (listeners: ChangeListener[]) => (listener:ChangeListener) => {
  listeners.push(listener);
  return () => remove(listener, listeners);
};

const notify = (listeners:ChangeListener[]) => (
  (change:Change) => listeners.forEach((listener) => listener(change))
);

export const createListenerStore = ():ListenerStore => {
  const listeners:ChangeListener[] = [];
  return {
    onChange: notify(listeners),
    addChangeListener: addChangeListener(listeners)
  };
};
