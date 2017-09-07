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
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import createMuiTheme from 'material-ui/styles/theme';
import createPalette from 'material-ui/styles/palette';
import blue from 'material-ui/colors/blue';
import pink from 'material-ui/colors/pink';

const client = makeClient('http://localhost:3011/query');
const theme = createMuiTheme({
  palette: createPalette({
    primary: blue,
    accent: pink,
    type: 'light',
  }),
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <Router>
      <Provider store={store}>
        <MuiThemeProvider theme={theme}>
          <Switch>
            <Route exact path='/login' component={Login} />
            <Route path='/' component={App} />
          </Switch>
        </MuiThemeProvider>
      </Provider>
    </Router>
  </ApolloProvider>, document.getElementById('root')
)
