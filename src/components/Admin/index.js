import React from 'react';

import { observer, inject } from 'mobx-react';
import { Route, Switch } from "react-router-dom";
import styles from './style.module.css';

import ServiceSpecs from './ServiceSpecs';
import ExtensionSpecs from './ExtensionSpecs';

@inject("store") @observer

export default class Admin extends React.Component {

  render() {
    console.log(this.props)
    const { serviceSpecs, extensionSpecs } = this.props;

    return (
      <div className={styles.root}>
        <Switch>
          <Route path='/admin/serviceSpecs' render={(props) => (
            <ServiceSpecs data={this.props.data} serviceSpecs={serviceSpecs} socket={this.props.socket} />
          )}/>         

          <Route path='/admin/extensionSpecs' render={(props) => (
            <ExtensionSpecs data={this.props.data} extensionSpecs={extensionSpecs} socket={this.props.socket} />
          )}/> 
        </Switch>
      </div>
    );
  }
}
