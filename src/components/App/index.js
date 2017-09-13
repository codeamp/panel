import React from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import styles from './style.module.css';
import { observable } from 'mobx';

//components
import LeftNav from 'components/LeftNav';
import TopNav from 'components/TopNav';
import Dashboard from 'components/Dashboard';
import Create from 'components/Create';
import Project from 'components/Project';
import Admin from 'components/Admin';
import Grid from 'material-ui/Grid';


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

@inject("store") @observer

export default class App extends React.Component {


    constructor(props) {
        super(props)
        this.state = {
            redirectToLogin: false,
            socket: null,
            reconnectCount: 0,
            reconnect: null
        };
    }


    onOpen(_evt) {
        //Tell the store we're connected
        // console.log( _evt)
        console.log(this)
        clearTimeout(this.state.reconnect)
        if (this.state.reconnectCount > 5) {
            this.state.reconnectCount = 0
            window.location.reload()
        }
    }

    onMessage(evt) {
        //Parse the JSON message received on the websocket
        evt = JSON.parse(evt.data);
        console.log(evt)
        this.props.store.app.ws = evt
    }


    componentWillReceiveProps(nextProps) {
        const {loading, user} = nextProps.data;
        console.log(nextProps)

        if (!loading && !user) {
            this.setState({redirectToLogin: true});
        }
    }

    componentWillReact() {
        console.log('app index', this.props.store.app.ws)
        if (this.props.store.app.ws.channel === "projects") {
            console.log("projects were updated" + this.props.store.app.ws.data);
            this.props.data.refetch();
        }
    }

    shouldComponentUpdate() {
        console.log('hello update')
        return true
    }

    componentWillMount() {
        this.state.socket = new WebSocket("ws://localhost:3003/")
        this.state.socket.onmessage = this.onMessage.bind(this)
        // this.state.socket.onclose = this.onClose.bind(this)
        this.state.socket.onopen = this.onOpen.bind(this)
        this.state.socket.onerror = function (_evt) {
        }
    }

  render() {
    const { loading, projects} = this.props.data;
    const { ws } = this.props.store.app

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
