import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Card, {CardContent, CardActions} from 'material-ui/Card';
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

export default class Settings extends React.Component {
  state = {
    notSet: true,    
  };

  componentWillMount(){
    const fields = [
      'id',
      'gitBranch',
      'gitProtocol',
      'gitUrl',
      'environmentId',
    ];
    const rules = {};
    const labels = {
      'gitBranch': 'Git Branch',
    };
    const initials = {
      'gitBranch': 'master',
    };
    const types = {};
    const extra = {};
    const hooks = {};
    const handlers = {};
    const plugins = { dvr: validatorjs };
    this.form = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { handlers }, { plugins })
  }

  updateProject(form){
    console.log('onBranchChange')
    console.log(form.values())
    this.props.updateProject({
      variables: form.values(),
    }).then(({data}) => {
      this.props.data.refetch()
    });
  }

  componentDidMount(){
    const { loading, project } = this.props.data; 
  }

  render() {
    const { loading, project } = this.props.data;
    const { notSet } = this.state;    
    const { currentEnvironment } = this.props.store.app;

    if(loading){
      return (<div>Loading</div>)
    }

    if(notSet){
      console.log(project)
      this.form.$('id').set(project.id)
      this.form.$('gitProtocol').set(project.gitProtocol)
      this.form.$('gitUrl').set(project.gitUrl)
      this.form.$('gitBranch').set(project.gitBranch)
      this.form.$('environmentId').set(currentEnvironment.id),
      this.setState({ notSet: false })
    }

    console.log(project.gitBranch, this.form.values()['gitBranch'])

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
            <Grid xs={12}>
              <CreateProject title={"Update Project"}
                type={"save changes"}
                project={project}
                loadLeftNavBar={false} />
            </Grid>
          </Grid>         
        </Grid>
      </div>
    );
  }
}
