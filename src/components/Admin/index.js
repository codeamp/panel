import React from 'react';

import { observer, inject } from 'mobx-react';
import { Route, Switch } from "react-router-dom";
import styles from './style.module.css';

import ServiceSpecs from './ServiceSpecs';

@inject("store") @observer

export default class Admin extends React.Component {

  componentWillMount() {
    console.log(this.props)    
  }

  render() {
    console.log(this.props)
    const { serviceSpecs } = this.props;
    console.log(serviceSpecs)

    return (
      <div className={styles.root}>
        <Switch>
          <Route path='/admin/serviceSpecs' render={(props) => (
            <ServiceSpecs data={this.props.data} serviceSpecs={serviceSpecs} socket={this.props.socket} />
          )}/>         
        </Switch>
      </div>
    );
  }
}
