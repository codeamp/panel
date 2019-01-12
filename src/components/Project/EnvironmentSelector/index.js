import React from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';

import Project from 'components/Project';
import DoesNotExist404 from 'components/Utils/DoesNotExist404'

import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import { withApollo } from 'react-apollo';

@inject("store") @observer

class EnvironmentSelector extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      fetchDelay: null,
      url: this.props.match.url,
      environmentAnchorEl: undefined,
      projectsMap: null,
      project: null,
    }
  }

  componentWillMount(){
    this.updateProjectFromProps(this.props)
  }

  updateProjectFromProps(props) {
    let projectsMap = {}
    props.projects.entries.forEach((project) => {
      projectsMap[project.slug] = project
    })
    
    let project = projectsMap[props.match.params.slug]
    this.setState({
      projectsMap: projectsMap,
      project: project,
      environment: this.getEnvironmentFromProps(props, project)
    })
  }

  getEnvironmentFromProps(props, project) {
    let currentEnv = props.store.app.currentEnvironment
    let environment = null

    // Iterate over all of the environments we received from the query
    project.environments.forEach((env) => {
      // Either the slug matches an env outright, OR we have a valid current env AND it matches the slug
      if(env.key === props.match.params.environment || env.key === currentEnv.key){
        environment = env
        return 
      }
    })

    return environment
  }

  handleEnvironmentSelect(environment) {
    this.props.store.app.setCurrentEnv({
      id: environment.id, 
      color: environment.color, 
      name: environment.name, 
      key: environment.key 
    })

    this.props.history.push(`/projects/${this.props.match.params.slug}/${environment.key}/features`)      
  } 

  handleEnvironmentClick = event => {
    this.setState({ environmentAnchorEl: event.currentTarget });
  };

  handleEnvironmentClose = (event, id) => {
    this.setState({ environmentAnchorEl: null });
  };

  renderEnvironmentSelector() {
    let project = this.state.project
    const { environments } = project;

    return (
      <div className={styles.root}>
        <Typography className={styles.project} variant="title"> {project.name} </Typography>
        <Typography className={styles.title} variant="title"> Select Environment </Typography>
        {environments.map((environment) => {
          return (
            <Button variant="raised" key={environment.id} className={styles.button} onClick={() => {this.handleEnvironmentSelect(environment)}} >
              {environment.name}
            </Button>
          )
        })}
      </div>
    );
  }

  componentWillReceiveProps(nextProps){
    this.updateProjectFromProps(nextProps)
  }

  render() {
    const { socket, user } = this.props;
    const { project, environment } = this.state;
  
    if(!project) {
      return (<DoesNotExist404/>)
    }

    // If we didn't find an environment name because it wasn't provided,
    // or because it was wrong ("dev" vs "development" for example) then 
    // present the user with the environment selection prompt
    if(!environment) {
      // They provided an environment, but it wasn't valid.
      // Redirect user to the environment selection page
      if(!!this.props.match.params.environment) {
        return (<Redirect to={`/projects/${this.props.match.params.slug}`}/>)
      } else {
        return this.renderEnvironmentSelector()
      }
    } else {    
      // If the url is good, then proceed on to rendering project or routing from there
      // If we have come in here after a visiting another proejct for the first time,
      // the environment will not be in the url. If that's the case, redirect to a form
      // that includes the environment name because project routing depends on it.
      return (      
        <Switch>
          <Route path='/projects/:slug/:environment' render={(props) => (
            <Project {...props} environment={environment} socket={socket} user={user}/>
          )}/>
          <Redirect from={`/projects/${this.props.match.params.slug}`} to={`/projects/${this.props.match.params.slug}/${environment.key}`}/>
        </Switch>      
      );
    }
  }
}

export default withApollo(EnvironmentSelector)
