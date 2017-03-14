export const dedup = () => ({ apiFnName, apiFn }) => {
  if (apiFn.operation !== 'READ') {
    return apiFn;
  }
}
