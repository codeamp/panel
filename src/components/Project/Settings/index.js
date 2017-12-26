import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import CreateProject from '../../Create';

@inject("store") @observer

@graphql(gql`
  mutation Mutation($id: String!, $gitProtocol: String!, $gitUrl: String!) {
    updateProject(project: { id: $id, gitProtocol: $gitProtocol, gitUrl: $gitUrl}) {
      id
      name
      slug
      repository
      gitUrl
      gitProtocol
      rsaPublicKey
    }
  }
`)

export default class Settings extends React.Component {
  state = {
    activeStep: 0,
  };
  
  updateProject(newProjectState){
    this.props.mutate({
      variables: {
        id: this.props.project.id,
        gitUrl: newProjectState.url,
        gitProtocol: newProjectState.repoType
      }
    }).then(({data}) => {
      this.props.data.refetch();
    });
  }

  render() {
    return (
      <div className={styles.root}>
        <Grid container spacing={24}>
          <Grid item sm={3}>
            <Typography type="title" className={styles.settingsDescription}>
              Project Settings
            </Typography>
            <br/>
            <Typography type="caption" className={styles.settingsCaption}>
              You can update your project settings to point to a different url
              or make appropriate cascading modifications (e.g. if your project became private).
            </Typography>
          </Grid>

          <Grid item sm={9}>
            <CreateProject title={"Update Project"}
              type={"save changes"}
              onProjectCreate={this.updateProject.bind(this)}
              project={this.props.project}
              loadLeftNavBar={false} />
          </Grid>
        </Grid>
      </div>
    );
  }
}
