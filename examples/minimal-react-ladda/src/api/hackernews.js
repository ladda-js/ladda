const BASE_URL = 'https://hn.algolia.com/api/v1/';

getList.operation = 'READ';
getList.idFrom = o => o.objectID;
function getList(query) {
  const url = `${BASE_URL}search?query=${query}&hitsPerPage=200`;
  return fetch(url)
    .then(response => response.json())
    .then(result => result.hits);
}

export {
  getList,
}