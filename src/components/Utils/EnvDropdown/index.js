import React from 'react';
import Typography from 'material-ui/Typography';
import Menu, { MenuItem } from 'material-ui/Menu';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import Loading from 'components/Utils/Loading';
import styles from './style.module.css';
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
  }
}


@inject("store") @observer
@graphql(gql`
query Project($slug: String, $environmentID: String){
  environments {
    id
    name
    color
    created
  }

  project(slug: $slug, environmentID: $environmentID) {
    id
    permissions 
  }
}
`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.store.app.currentEnvironment.id,
    }
  })
})

@observer
export default class EnvDropdown extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      environmentAnchorEl: undefined,
    }
  }

  handleEnvironmentClick = event => {
    this.setState({ environmentAnchorEl: event.currentTarget });
  };

  handleEnvironmentClose = (event, id) => {
    this.setState({ environmentAnchorEl: null });
  };

  handleEnvironmentSelect = (id) => {
  	const { environments } = this.props.data;

    environments.map((env) => {
      if(env.id === id){
        this.props.store.app.setCurrentEnv({id: id, color: env.color, name: env.name })
        this.props.client.resetStore()
        return null
      }
      return null
    })

    this.setState({ environmentAnchorEl: null });
  }

  render() {
    const { loading, project, environments } = this.props.data;
    const { app } = this.props.store;

    if(loading){
      return <Loading />
    }

    return (
      <Grid style={{ display: 'inline-block'}}>
        <Button
        style={{margin: "0 8px"}}
        variant="raised"
        aria-owns={this.state.environmentAnchorEl ? 'environment-menu' : null}
        aria-haspopup="true"
        onClick={this.handleEnvironmentClick.bind(this)}>
          {app.currentEnvironment.name}
          </Button>
          <Menu
        id="environment-menu"
        anchorEl={this.state.environmentAnchorEl}
        open={Boolean(this.state.environmentAnchorEl)}
        onClose={this.handleEnvironmentClose.bind(this)}>
          {environments.map((env) => {
            // check if env is in project permissions
            if(project.permissions.includes(env.id)){
              return (<MenuItem 
                key={env.id}
                onClick={this.handleEnvironmentSelect.bind(this, env.id)}>
                {env.name}
                </MenuItem>)
            }
          })}
          </Menu>
      </Grid>
    )
  }
}
