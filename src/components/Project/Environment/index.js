import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import DoesNotExist404 from 'components/Utils/DoesNotExist404'

@inject("store") @observer

@graphql(gql`
  query Environments($slug: String, $skipProject: Boolean!){
    environments(projectSlug: $slug) {
      id
      name
      key
      color
      created
    }
    project(slug: $slug) @skip(if:$skipProject) {
      id
      name
    }
  }`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      skipProject: !!props.project,
    }
  })
})

export default class Environment extends React.Component {
  constructor(props){
    super(props)
    this.state = {

    }
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

  renderEnvironmentSelector() {
    const { environments } = this.props.data;
    let project = this.props.project
    if (!project){
      project = this.props.data.project
    }

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
    const { loading, environments, project } = this.props.data;
    if(loading){
      return null
    }

    if (project === null && environments === null) {
      return <DoesNotExist404/>
    }

    let currentEnv = this.props.store.app.currentEnvironment
    let environmentName = null

    // Iterate over all of the environments we received from the query
    environments.forEach((env) => {
      // If the environment slug (from the url) matches one of the env's in our list
      // OR
      // if the environment in the app-store matches one of the env's in the list
      if(env.key === this.props.match.params.environment || currentEnv.key === env.key){
        // If the current env is unset, or the new env is different from the app-store's env
        // then update the app-store
        if(!currentEnv.key || currentEnv.key !== env.key) {
          this.props.store.app.setCurrentEnv({
            id: env.id, 
            color: env.color, 
            name: env.name, 
            key: env.key 
          })
        }

        environmentName = env.key
        return 
      }
    })

    // If we didn't find an environment name because it wasn't provided,
    // or because it was wrong ("dev" vs "development" for example) then 
    // present the user with the environment selection prompt
    if(!environmentName) {
      return this.renderEnvironmentSelector()
    } else {
      // If we have a valid environment, redirect the user to the 
      // url with the environment encoded (it will send us back through here once more)
      return <EnvironmentForwarder {...this.props} env={environmentName}/>
    }
  }

}

class EnvironmentForwarder extends React.Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  componentWillMount() {
    if (!!this.props.env) {
      this.props.history.push(`/projects/${this.props.match.params.slug}/${this.props.env}/features`)
    }
  }

  render() {
    return null
  }
}