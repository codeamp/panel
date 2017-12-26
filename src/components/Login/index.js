import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Switch, Route } from "react-router-dom";
import Oidc from 'oidc-client'

var settings = {
  authority: 'http://localhost:5556/dex',
  client_id: 'example-app',
  redirect_uri: 'http://localhost:3010/login/callback',
  post_logout_redirect_uri: 'http://localhost:3010/logout',
  response_type: 'id_token token',
  scope: 'openid email groups',
  filterProtocolClaims: true,
  loadUserInfo: false
};

var userManger = new Oidc.UserManager(settings);

userManger.events.addAccessTokenExpiring(function () {
  console.log("token expiring");
});

userManger.events.addAccessTokenExpired(function () {
  console.log("token expired");
});

userManger.events.addSilentRenewError(function (e) {
  console.log("silent renew error", e.message);
});

userManger.events.addUserUnloaded(function (e) {
  console.log("user unloaded");
});

@inject("store") @observer
class Dex extends Component {
  componentWillMount() {
    userManger.clearStaleState(null).then(() => {
      let args: any = {};
      userManger.signinRedirect(args).then(function() {
      }).catch(function(err) {
        console.log(err);
      });
    });
  }

  render() {
    return (
      <div>
        <button onClick={this.startSigninMainWindow.bind(this)}>Signin</button>
      </div>
    );
  }
}

@inject("store") @observer
class Callback extends Component {
  componentWillMount() {
    userManger.events.addUserLoaded((user) => {
      this.props.store.app.setUser(user)
    });

    userManger.signinRedirectCallback().then(function(user) {
      window.location.href = '/'
    }).catch(function(err) {
      console.log(err);
    });
  }

  render() {
    return null;
  }
}

@inject("store") @observer
class Login extends Component {
  render() {
    return (
      <div>
        <Switch>
          <Route exact path='/login' render={(props) => (
            <Dex/>
          )} />
          <Route exact path='/login/callback' render={(props) => (
            <Callback/>
          )} />
        </Switch>
      </div>
    );
  }
}

export default Login;
