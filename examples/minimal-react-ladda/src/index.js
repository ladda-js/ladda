import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import api from './api';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = { list: null };
    }

    onSearch = (e) => {
      e.preventDefault();

      if (this.input.value == '') {
        return;
      }

      api.hackernews.getList(this.input.value)
        .then((hits) => this.setState({ list: hits }));
    }

    render() {
      const { list } = this.state;
      return (
        <div>
          <h1>Search Hacker News with Ladda</h1>
          <p>There shouldn't be a second network request, when you search for something twice.</p>
          <form type="submit" onSubmit={this.onSearch}>
            <input type="text" ref={node => this.input = node} />
            <button type="text">Search</button>
          </form>
          { list && list.map(item => <div key={item.objectID}>{item.title}</div>) }
        </div>
      );
    }

}

ReactDOM.render(
  <App />,
  document.getElementById('app')
);

module.hot.accept();
