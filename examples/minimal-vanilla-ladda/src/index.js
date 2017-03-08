import api from './api';

const addButtonEvent = () =>
  document.getElementById('searchButton')
    .addEventListener('click', onSearch);

const onSearch = () => {
  removeList();

  doSearch(getElementByIdValue('searchInput'))
    .then(appendList);
};

const getElementByIdValue = id =>
  document.getElementById(id).value;

const doSearch = query =>
  api.hackernews.getList(query);

const removeList = () => {
  const listNode = document.getElementById('list');

  if (listNode) {
    listNode.parentNode.removeChild(listNode);
  }
}

const appendList = list => {
  const listNode = document.createElement('div');
  listNode.setAttribute('id', 'list');
  document.getElementById('app').appendChild(listNode);

  list.forEach(appendItem(listNode));
};

const appendItem = listNode => item => {
  const itemNode = document.createElement('div');
  itemNode.appendChild(document.createTextNode(item.title));
  listNode.appendChild(itemNode);
};

(() => addButtonEvent())();
