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
import JssProvider from 'react-jss/lib/JssProvider';
import { create } from 'jss';
import preset from 'jss-preset-default';
import { createGenerateClassName } from 'material-ui/styles';

const generateClassName = createGenerateClassName();
const jss = create(preset());
jss.options.insertionPoint = 'insertion-point-jss';

const client = makeClient('http://localhost:3011/query');
const theme = createMuiTheme({
  palette: createPalette({
    primary: blue,
    secondary: pink,
    type: 'light',
  }),
});

ReactDOM.render(
  <JssProvider jss={jss} generateClassName={generateClassName}>
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
    </ApolloProvider>
  </JssProvider>, document.getElementById('root')
)
