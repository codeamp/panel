import React from 'react';

import { observer, inject } from 'mobx-react';
import { Route, Switch } from "react-router-dom";
import styles from './style.module.css';

import ServiceSpecs from './ServiceSpecs';
import ExtensionSpecs from './ExtensionSpecs';
import EnvironmentVariables from './EnvironmentVariables';
import Environments from './Environments';

@inject("store") @observer

export default class Admin extends React.Component {

  render() {
    console.log(this.props)
    const { serviceSpecs, extensionSpecs, environmentVariables, environments } = this.props;

    return (
      <div className={styles.root}>
        <Switch>
          <Route path='/admin/serviceSpecs' render={(props) => (
            <ServiceSpecs data={this.props.data} serviceSpecs={serviceSpecs} socket={this.props.socket} />
          )}/>

          <Route path='/admin/envVars' render={(props) => (
              <EnvironmentVariables data={this.props.data}
                environmentVariables={environmentVariables}
                environments={environments}
                socket={this.props.socket} />
          )} />

          <Route path='/admin/extensionSpecs' render={(props) => (
            <ExtensionSpecs data={this.props.data} extensionSpecs={extensionSpecs} environmentVariables={environmentVariables} socket={this.props.socket} />
          )}/>

          <Route path='/admin/environments' render={(props) => (
            <Environments data={this.props.data} environments={environments} environmentVariables={environmentVariables} socket={this.props.socket} {...this.props} />
          )}/>
        </Switch>
      </div>
    );
  }
}
