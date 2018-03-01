import React from 'react';

import { observer, inject } from 'mobx-react';
import { Route, Switch } from "react-router-dom";
import styles from './style.module.css';

import ServiceSpecs from './ServiceSpecs';
import Extensions from './Extensions';
import Secrets from './Secrets';
import Environments from './Environments';
import Users from './Users';

@inject("store") @observer

export default class Admin extends React.Component {

  render() {
    return (
      <div className={styles.root}>
        <Switch>
          <Route path='/admin/serviceSpecs' render={(props) => (
            <ServiceSpecs/>
          )}/>

          <Route path='/admin/secrets' render={(props) => (
            <Secrets/>
          )} />

          <Route path='/admin/extensions' render={(props) => (
            <Extensions/>
          )}/>

          <Route path='/admin/users' render={(props) => (
            <Users data={this.props.data} socket={this.props.socket} />
          )}/>                    

          <Route path='/admin/environments' render={(props) => (
            <Environments/>
          )}/>
        </Switch>
      </div>
    );
  }
}
