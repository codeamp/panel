import React from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import styles from './style.module.css';
import io from 'socket.io-client';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Snackbar from 'material-ui/Snackbar';
import Button from 'material-ui/Button';
import LeftNav from 'components/LeftNav';
import TopNav from 'components/TopNav';
import Dashboard from 'components/Dashboard';
import Create from 'components/Create';
import Project from 'components/Project';
import ProjectEnvironment from 'components/Project/Environment';
import Admin from 'components/Admin';
import Loading from 'components/Utils/Loading';

const socket = io(process.env.REACT_APP_CIRCUIT_WSS_URI);

@graphql(gql`
  query UserProjects($projectSearch: ProjectSearchInput){
    user {
      id
      email
      permissions
    }
    projects(projectSearch: $projectSearch){
      id
      name
      slug
      environments {
        id
        name
        color
      }
    }
  }
`, {
	options: (props) => ({
		variables: {
			projectSearch: {
				repository: "",
				bookmarked: true,
			}
		}
	})
})
@inject("store") @observer
export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      redirectToLogin: false,
      drawer: {
        open: false,
        component: null,
      },
      fetchDelay: null,
    };
  }

  componentDidMount() {
    socket.on('reconnect_failed', () => {
        // todo
    });

    socket.on('reconnect', () => {
        this.props.data.refetch()
        this.props.store.app.setConnectionHeader({ msg: "", type: "SUCCESS" })
    });

    socket.on('reconnecting', () => {
        this.props.store.app.setConnectionHeader({ msg: "Attempting to reconnect to server...", type: "FAIL" })
    });

    socket.on('projects', (data) => {
      this.props.data.refetch();
    });
  }

  render() {
    const { loading, projects, user } = this.props.data;

    if(this.props.data.networkStatus === 8){
      return (
        <div className={styles.root}>
            <Grid item xs={12} className={styles.top}>
              <TopNav projects={[]} {...this.props} />
            </Grid>
            <Grid item xs={4}></Grid>
            <Grid item xs={5} className={styles.center}>
                  <Grid container spacing={24}>
                    <Grid item xs={12}>
                      <Typography type="title">
                        Internal Server Error
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography type="body2">
                        We apologize but there is a problem in resolving your request to the server. Please bear with us as we resolve
                      this on our side. Contact devops@checkr.com if you continue to have any issues. Thank you!
                      </Typography>
                    </Grid>
                  </Grid>
            </Grid>
            <Grid item xs={3}></Grid>
        </div>
      )
    }

    if (loading) {
      return (
        <Loading />
      );
    } else if (this.state.redirectToLogin) {
      return <Redirect to={{pathname: '/login', state: { from: this.props.location }}}/>
    } else {
      if(!user){
          return <Redirect to={{pathname: '/login', state: { from: this.props.location }}}/>
      }

      return (
        <div className={styles.root}>
          <Grid container spacing={0}>
            <Grid item xs={12} className={styles.top}>
              <TopNav {...this.props} /> 
            </Grid>
            <Grid item xs={12} className={styles.center}> 
              <LeftNav {...this.props} />
              <div className={styles.children}>
                <Switch> 
                  <Route exact path='/' render={(props) => (
                    <Dashboard projects={projects} />
                  )} />
                  <Route exact path='/create' render={(props) => (
                    <Create projects={projects} type={"create"} {...props} />
                  )} />
                  <Route path='/admin' render={(props) => (
                    <Admin data={this.props.data} projects={projects} {...props} />
                  )} />
                  <Route exact path='/projects/:slug' render={(props) => (
                    <ProjectEnvironment {...props}>
                      <Project socket={socket} {...props} />
                    </ProjectEnvironment>
                  )} />
                  <Route path='/projects/:slug/:environment' render={(props) => (
                    <ProjectEnvironment {...props}>
                      <Project socket={socket} {...props} />
                    </ProjectEnvironment>
                  )} />
                </Switch>
              </div>
            </Grid>
          </Grid>
          <Snackbar
            open={this.props.store.app.snackbar.open}
            className={styles.snackbar}
            onClose={() => {this.props.store.app.setSnackbar({ open: false })}}
            SnackbarContentProps={{
              'aria-describedby': 'message-id',
              className: styles.snackbarContent,
            }}
            message={<span id="message-id">{this.props.store.app.snackbar.msg}</span>}
            action={
              <Button color="inherit" size="small" onClick={() => {this.props.store.app.setSnackbar({ open: false })}}>
                Close
              </Button>              
            }
          />
        </div>

      );
    }
  }
}
