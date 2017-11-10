import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

//mobx
import {Provider} from 'mobx-react';
import store from 'mobx/store';

//components
import App from 'components/App';
import Login from 'components/Login';

// Apollo
import { ApolloProvider } from 'react-apollo';
import makeClient from 'lib/apollo';

// MUI
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import createPalette from 'material-ui/styles/createPalette';
import { blue, pink } from 'material-ui/colors';

const client = makeClient('http://localhost:3011/query');
const theme = createMuiTheme({
  palette: createPalette({
    primary: blue,
    secondary: pink,
    type: 'light',
  }),
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <Router>
      <Provider store={store}>
        <MuiThemeProvider theme={theme}>
          <Switch>
            <Route path='/login' component={Login} />
            <Route path='/' component={App} />
          </Switch>
        </MuiThemeProvider>
      </Provider>
    </Router>
  </ApolloProvider>, document.getElementById('root')
)
