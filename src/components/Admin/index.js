import React from 'react';
import { observer, inject } from 'mobx-react';
import { Route, Switch } from "react-router-dom";
import Loading from 'components/Utils/Loading';
import styles from './style.module.css';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import ServiceSpecs from './ServiceSpecs';
import Extensions from './Extensions';
import Secrets from './Secrets';
import Environments from './Environments';
import Users from './Users';

@graphql(gql`
  query {
    user {
      id
      email
      permissions
    }
  }
`,{
  options: {
    fetchPolicy: 'cache-and-network'
  }
})

@inject("store") @observer

export default class Admin extends React.Component {

  render() {
    const { loading, user } = this.props.data;
    if(loading){
        return <Loading />
    }
    // redirect if no admin permission
    if(!user.permissions.includes("admin")){
        this.props.history.push("/")
    }

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
