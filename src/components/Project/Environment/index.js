import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

@inject("store") @observer

@graphql(gql`
  query Environments($slug: String){
    environments(projectSlug: $slug) {
      id
      name
      key
      color
      created
    }
  }`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
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
    this.props.history.push('/projects/'+this.props.match.params.slug+"/"+environment.key)      
  } 

  renderEnvironmentSelector() {
    const { environments } = this.props.data;

    return (
      <div className={styles.root}>
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
    const { loading, environments } = this.props.data;
    if(loading){
      return null
    }

    let currentEnv = this.props.store.app.currentEnvironment
    let matched = false
    environments.map((env) => {
      if(env.key === currentEnv.key || env.key === this.props.match.params.environment){
        matched = true
        
        if(!currentEnv.key) {
          this.props.store.app.setCurrentEnv({
            id: env.id, 
            color: env.color, 
            name: env.name, 
            key: env.key 
          })

          if(!this.props.match.params.environment) {
            this.props.history.push('/projects/' + env.key + "/" + this.props.match.params.slug)      
          }
        }

        return null
      }
      return null
    })

    if(!matched) {
      return this.renderEnvironmentSelector()
    }

    return (
      <div>
        {this.props.children}
      </div>
    );
  }

}
