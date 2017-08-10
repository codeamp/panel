import React from 'react';
import ReactDOM from 'react-dom';
import {MobxRouter, startRouter} from 'mobx-router';

//mobx
import {Provider} from 'mobx-react';
import store from 'mobx/store';

//router
import views from 'config/views';
startRouter(views, store);

// Apollo
import { ApolloProvider } from 'react-apollo';
import makeClient from 'lib/apollo';
const client = makeClient('http://localhost:3001/query');

ReactDOM.render(
  <ApolloProvider client={client}>
    <Provider store={store}>
      <MobxRouter/>
    </Provider>
  </ApolloProvider>, document.getElementById('root')
)
