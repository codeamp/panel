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

    environments.forEach((env) => {
      if(env.key === this.props.match.params.environment || (!!currentEnv && currentEnv.key === env.key)){
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

    if(!environmentName) {
      return this.renderEnvironmentSelector()
    } else {
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