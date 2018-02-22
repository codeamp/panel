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
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';
import LeftNav from 'components/LeftNav';
import TopNav from 'components/TopNav';
import Dashboard from 'components/Dashboard';
import Create from 'components/Create';
import Project from 'components/Project';
import Admin from 'components/Admin';

const socket = io(process.env.REACT_APP_CIRCUIT_URI);

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
    environments {
      id
      name
    }
  }
`)

@inject("store") @observer

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      redirectToLogin: false,
      snackbar: {
        open: false,
        lastCreated: null,
      },
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

  handleRequestClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setState({ snackbar: { open: false, lastCreated: this.state.snackbar.lastCreated } });
  };

  componentDidUpdate = (prevProps, prevState) => {
    if(prevProps.store.app.snackbar.created !== prevState.snackbar.lastCreated){
      this.setState({snackbar: {
        open: true,
        lastCreated: this.props.store.app.snackbar.created
      }})
    }
  }

  render() {
    const { loading, projects, user, environments } = this.props.data;

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
      return (<div>Loading...</div>);
    } else if (this.state.redirectToLogin) {
      return <Redirect to={{pathname: '/login', state: { from: this.props.location }}}/>
    } else {
      if(environments.length > 0 && this.props.store.app.currentEnvironment.id === ''){
        this.props.store.app.setCurrentEnv({ id: environments[0].id })
      }
      if(!user){
          return <Redirect to={{pathname: '/login', state: { from: this.props.location }}}/>
      }
      return (
        <div className={styles.root}>
          <Grid container spacing={0}>
            <Grid item xs={12} className={styles.top}>
              <TopNav projects={projects} {...this.props} />
            </Grid>
            <Grid item xs={12} className={styles.center}>
              <LeftNav environments={environments} />
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
                  <Route path='/projects/:slug' render={(props) => (
                    <Project socket={socket} {...props} />
                  )} />
                </Switch>
              </div>
            </Grid>
          </Grid>

          <Snackbar
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            open={this.state.snackbar.open}
            autoHideDuration={6000}
            SnackbarContentProps={{
              'aria-describedby': 'message-id',
            }}
            message={<span id="message-id">{this.props.store.app.snackbar.msg}</span>}
            action={[
              <IconButton key="close" aria-label="Close" color="inherit" onClick={this.handleRequestClose}>
                <CloseIcon />
              </IconButton>,
            ]}
          />
        </div>

      );
    }
  }
}
