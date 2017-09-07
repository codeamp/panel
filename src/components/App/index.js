import React from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import styles from './style.module.css';

//components
import LeftNav from 'components/LeftNav';
import TopNav from 'components/TopNav';
import Dashboard from 'components/Dashboard';
import Create from 'components/Create';
import Project from 'components/Project';
import Admin from 'components/Admin';
import Grid from 'material-ui/Grid';

@inject("store") @observer
@graphql(gql`
  query {
    user {
      id
      email
    }
    projects {
      id
      name
      slug
    }
  }
`)

export default class App extends React.Component {
  state = {
    redirectToLogin: false,
  };

  componentWillReceiveProps(nextProps) {
    const { loading, user } = nextProps.data;

    if (!loading && !user) {
      this.setState({ redirectToLogin: true });
    }
  }

  render() {
    const { loading, projects } = this.props.data;

    if (loading) {
      return <div>Loading</div>;
    } else if (this.state.redirectToLogin) {
      return <Redirect to={{pathname: '/login', state: { from: this.props.location }}}/>
    } else { 
      return (
        <div className={styles.root}>
          <Grid container spacing={0}>
            <Grid item xs={12} className={styles.top}>
              <TopNav/>
            </Grid>
            <Grid item xs={12} className={styles.center}>
              <LeftNav/>
              <div className={styles.children}>
                <Switch>
                  <Route exact path='/' render={(props) => (
                    <Dashboard projects={projects} />
                  )} />
                  <Route exact path='/create' render={(props) => (
                    <Create projects={projects} />
                  )} />
                  <Route exact path='/admin' render={(props) => (
                    <Admin projects={projects} />
                  )} />
                  <Route path='/projects/:slug' component={Project} />
                </Switch>
              </div>
            </Grid>
          </Grid>
        </div>
      );
    }
  }
}
