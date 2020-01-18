export interface ListenerStore<T> {
  onChange: Listener<T>
  addChangeListener(listener: Listener<T>): () => Listener<T>[]
}

export interface Listener<T> {
  (change:T):void
}

const remove = <T>(el:T, arr:T[]) => {
  const i = arr.indexOf(el);
  if (i !== -1) { arr.splice(i, 1); }
  return arr;
};

const addChangeListener = <T>(listeners: T[]) => (listener:T) => {
  listeners.push(listener);
  return () => remove(listener, listeners);
};

const notify = <T>(listeners:Listener<T>[]) => (
  (change:T) => listeners.forEach((listener) => listener(change))
);

export const createListenerStore = <T>():ListenerStore<T> => {
  const listeners:Listener<T>[] = [];
  return {
    onChange: notify(listeners),
    addChangeListener: addChangeListener(listeners)
  };
};
