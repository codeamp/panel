import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import Grid from 'material-ui/Grid';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import InputField from 'components/Form/input-field';
import CreateProject from '../../Create';

@inject("store") @observer

@graphql(gql`
  query Project($slug: String, $environmentId: String){
    project(slug: $slug, environmentId: $environmentId) {
      id
      name
      slug
      repository
      gitUrl
      gitProtocol
      environmentBasedProjectBranch {
        id
        environment {
          id
        }
        project {
          id
        }
        gitBranch
      }
    }
  }`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentId: props.store.app.currentEnvironment.id,
    }
  })
})

@graphql(gql`
  mutation Mutation($id: String!, $gitProtocol: String!, $gitUrl: String!,  $environmentId: String!) {
    updateProject(project: { id: $id, gitProtocol: $gitProtocol, gitUrl: $gitUrl, environmentId: $environmentId}) {
      id
      name
      slug
      repository
      gitUrl
      gitProtocol
      rsaPublicKey
    }
  }
`, { name: "updateProject"})

@graphql(gql`
  mutation Mutation($id: String!, $environmentId: String!, $projectId: String!,  $gitBranch: String!) {
    createEnvironmentBasedProjectBranch(environmentBasedProjectBranch: { id: $id, projectId: $projectId, environmentId: $environmentId, gitBranch: $gitBranch}) {
      id
      gitBranch
    }
  }
`, { name: "createEnvironmentBasedProjectBranch"})

@graphql(gql`
  mutation Mutation($id: String!, $environmentId: String!, $projectId: String!,  $gitBranch: String!) {
    updateEnvironmentBasedProjectBranch(environmentBasedProjectBranch: { id: $id, projectId: $projectId, environmentId: $environmentId, gitBranch: $gitBranch}) {
      id
      gitBranch
    }
  }
`, { name: "updateEnvironmentBasedProjectBranch"})

export default class Settings extends React.Component {
  state = {
    notSet: true,    
  };

  createProjectForm(){
    const fields = [
      'id',
      'gitProtocol',
      'gitUrl',
      'environmentId',
    ];
    const rules = {};
    const labels = {
      'gitBranch': 'Git Branch',
    };
    const initials = {
    };
    const types = {};
    const extra = {};
    const hooks = {};
    const handlers = {};
    const plugins = { dvr: validatorjs };
    this.form = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { handlers }, { plugins })    
  }
  
  createEnvironmentBasedProjectBranchForm(){
    const fields = [
      'id',
      'gitBranch',
      'environmentId',
      'projectId',
    ];
    const rules = {
      'gitBranch': 'string|required',
    };
    const labels = {
      'gitBranch': 'Git Branch',
    };
    const initials = {
    };
    const types = {};
    const extra = {};
    const hooks = {};
    const handlers = {};
    const plugins = { dvr: validatorjs };
    this.envBasedProjectBranchForm = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { handlers }, { plugins })        
  }

  componentWillMount(){
    this.createProjectForm()
    this.createEnvironmentBasedProjectBranchForm()
  }

  updateProject(form){
    this.props.updateProject({
      variables: form.values(),
    }).then(({data}) => {
      this.props.data.refetch()
    });
  }

  createEnvBasedProjectBranch(form){
    if(form.values()['gitBranch'] !== "" && form.values()['projectId'] !== "" && form.values()['environmentId'] !== ""){
      this.props.createEnvironmentBasedProjectBranch({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
      });
    }
  }

  updateEnvBasedProjectBranch(form){
    this.props.updateEnvironmentBasedProjectBranch({
      variables: form.values(),
    }).then(({data}) => {
      this.props.data.refetch()
    });    
  }

  onError(form){
    console.log('onError')
  }

  onUpdateEnvironmentBasedProjectBranch(e){
    if(!this.envBasedProjectBranchForm.$('id').value){
      this.envBasedProjectBranchForm.$('environmentId').set(this.props.store.app.currentEnvironment.id)
      this.envBasedProjectBranchForm.$('projectId').set(this.props.data.project.id)
      this.envBasedProjectBranchForm.onSubmit(e, { onSuccess: this.createEnvBasedProjectBranch.bind(this), onError: this.onError.bind(this) })
    } else {
      this.envBasedProjectBranchForm.onSubmit(e, { onSuccess: this.updateEnvBasedProjectBranch.bind(this), onError: this.onError.bind(this) })
    }
  }

  componentWillUpdate(nextProps, nextState){
    nextProps.data.refetch()
    this.envBasedProjectBranchForm.reset()
    this.form.reset()
  } 

  render() {
    const { loading, project } = this.props.data;
    const { notSet } = this.state;    
    const { currentEnvironment } = this.props.store.app;

    if(loading){
      return (<div>Loading</div>)
    }


    if(notSet){
      this.form.$('id').set(project.id)
      this.form.$('gitProtocol').set(project.gitProtocol)
      this.form.$('gitUrl').set(project.gitUrl)
      this.form.$('environmentId').set(currentEnvironment.id)
      this.setState({ notSet: false })
    }

    if(project.environmentBasedProjectBranch){
      this.envBasedProjectBranchForm.$('id').set(project.environmentBasedProjectBranch.id)
      this.envBasedProjectBranchForm.$('environmentId').set(project.environmentBasedProjectBranch.environmentId)
      this.envBasedProjectBranchForm.$('projectId').set(project.environmentBasedProjectBranch.projectId)
      this.envBasedProjectBranchForm.$('gitBranch').set(project.environmentBasedProjectBranch.gitBranch)
    }

    return (
      <div className={styles.root}>
        <Grid container spacing={24}> 
          <Grid item sm={3}>
            <Typography variant="title" className={styles.settingsDescription}>
              Repository Settings
            </Typography>
            <Typography variant="caption" className={styles.settingsCaption}>
              You can update your project settings to point to a different url
              or make appropriate cascading modifications (e.g. if your project became private).
            </Typography>
          </Grid>

          <Grid item sm={9}>
            <Grid xs={12}>
              <CreateProject title={"Update Project"}
                type={"save changes"}
                project={project}
                loadLeftNavBar={false} />
            </Grid>
          </Grid>  
          <Grid item sm={3}>
            <Typography variant="title" className={styles.settingsDescription}>
              Branch Settings
            </Typography>
            <Typography variant="caption" className={styles.settingsCaption}>
              Updating your branch will update the Features page to show commits from the
              chosen branch. Make sure the selected branch exists.
            </Typography>
          </Grid>

          <Grid item sm={9}>
            <Grid xs={12}>
              <InputField field={this.envBasedProjectBranchForm.$('gitBranch')} fullWidth={true} />            
            </Grid>
            <Grid item xs={12}>
              <Button color="primary"
                type="submit"
                variant="raised"
                onClick={(e) => this.onUpdateEnvironmentBasedProjectBranch(e)}>
                  Save
              </Button>
            </Grid>            
          </Grid>                   
        </Grid>
      </div>
    );
  }
}
