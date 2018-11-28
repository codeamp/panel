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
    let projectsMap = {}
    this.props.projects.entries.forEach((project) => {
      projectsMap[project.slug] = project
    })
    this.setState({
      projectsMap: projectsMap,
      project: projectsMap[this.props.match.params.slug]
    })
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

  render() {
    const { socket } = this.props;
    const { project } = this.state;
  
    if(!project) {
      return (<DoesNotExist404/>)
    }

    let environments = project.environments

    let currentEnv = this.props.store.app.currentEnvironment
    let environment = null

    // Iterate over all of the environments we received from the query
    environments.forEach((env) => {
      if(env.key === this.props.match.params.environment || currentEnv.key === env.key){
        environment = env
        return 
      }
    })

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
      return (      
        <Switch>
          <Route path='/projects/:slug/:environment' render={(props) => (
            <Project {...props} environment={environment} socket={socket}/>
          )}/>
        </Switch>      
      );
    }
  }
}

export default withApollo(EnvironmentSelector)