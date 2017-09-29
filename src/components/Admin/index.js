import React from 'react';

import { observer, inject } from 'mobx-react';
import { Route, Switch } from "react-router-dom";
import styles from './style.module.css';

import ServiceSpecIcon from 'material-ui-icons/Description';

import ServiceSpecs from './ServiceSpecs';

@inject("store") @observer

export default class Admin extends React.Component {
  componentWillMount() {
    console.log(this.props)
    this.props.store.app.leftNavItems = [
      {
        key: "10",
        icon: <ServiceSpecIcon />,
        name: "Service Specs",
        slug: this.props.match.url + "/serviceSpecs",
      }, 
    ]; 
  }


  render() {
    console.log(this.props)
    const { serviceSpecs } = this.props;
    console.log(serviceSpecs)

    return (
      <div className={styles.root}>
        <Switch>
          <Route path='/admin/serviceSpecs' render={(props) => (
            <ServiceSpecs serviceSpecs={serviceSpecs} />
          )}/>         
        </Switch>
      </div>
    );
  }
}
