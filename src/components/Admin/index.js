import React from 'react';
import { observer, inject } from 'mobx-react';
import { Route, Switch } from "react-router-dom";
import Loading from 'components/Utils/Loading';
import DoesNotExist404 from 'components/Utils/DoesNotExist404';
import styles from './style.module.css';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import ServiceSpecs from './ServiceSpecs';
import Extensions from './Extensions';
import Secrets from './Secrets';
import Environments from './Environments';
import Users from './Users';
import Projects from './Projects';

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

          <Route path='/admin/projects' render={(props) => (
            <Projects data={this.props.data} socket={this.props.socket} {...props} />
          )}/>                              

          <Route path='/admin/environments' render={(props) => (
            <Environments/>
          )}/>
          <Route component={DoesNotExist404} />
        </Switch>
      </div>
    );
  }
}
