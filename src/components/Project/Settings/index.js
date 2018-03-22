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
import CheckboxField from 'components/Form/checkbox-field';
import Card, {CardContent, CardActions} from 'material-ui/Card';
import { FormLabel, FormControl, FormControlLabel } from 'material-ui/Form';
import Radio, {RadioGroup} from 'material-ui/Radio';

@inject("store") @observer

@graphql(gql`
  query Project($slug: String, $environmentID: String){
    project(slug: $slug, environmentID: $environmentID) {
      id
      name
      slug
      repository
      gitUrl
      gitProtocol
      gitBranch
      environments {
        id
        name
        key
      }
    }
    environments {
      id
      name
      key
    }
    user {
      id
      permissions
    }
  }`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.store.app.currentEnvironment.id,
    }
  })
})

@graphql(gql`
  mutation Mutation($id: String!, $gitProtocol: String!, $gitUrl: String!,  $environmentID: String!, $gitBranch: String) {
    updateProject(project: { id: $id, gitProtocol: $gitProtocol, gitUrl: $gitUrl, environmentID: $environmentID, gitBranch: $gitBranch}) {
      id
      name
      slug
      repository
      gitUrl
      gitBranch
      gitProtocol
    }
  }
`, { name: "updateProject"})

@graphql(gql`
  mutation Mutation($projectID: String!, $environments: [ProjectEnvironmentInput!]!) {
    updateProjectEnvironments(projectEnvironments: { projectID: $projectID, permissions: $environments }){
      id 
    }
  }
`, { name: "updateProjectEnvironments"})

export default class Settings extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      settingsSet: false
    }
  }

  createProjectForm(){
    const fields = [
      'id',
      'gitProtocol',
      'gitUrl',
      'environmentID',
      'gitBranch',
      'environments',
      'environments[]',
      'environments[].environmentID',
      'environments[].label',
      'environments[].grant',
    ];
    const rules = {};
    const labels = {
      'gitBranch': 'Git Branch',
      'gitUrl': 'Git Url',
    };
    const initials = {
    };
    const types = {
      'environments[].grant': 'checkbox',
    };
    const extra = {};
    const hooks = {};
    const handlers = {};
    const plugins = { dvr: validatorjs };
    this.form = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { handlers }, { plugins })    
  }

  componentWillMount(){
    this.createProjectForm()
  }

  componentWillReceiveProps(nextProps){
    if (!nextProps.data.loading && this.props.data.loading) {
      this.setFormValues(nextProps)
    }
  } 

  updateProject(form){
    this.props.updateProject({
      variables: form.values(),
    }).then(({data}) => {
      this.props.data.refetch()
    });
  }

  updateSettings(form){
    this.props.updateProject({
      variables: form.values(),
    }).then(({data}) => {
      this.props.data.refetch()
    });    
  }

  onError(form){
    console.log('onError')
  }

  onUpdateSettings(e){
    this.form.onSubmit(e, { onSuccess: this.updateSettings.bind(this), onError: this.onError.bind(this) })
  }

  updateProjectEnvironments(form){
    const { project } = this.props.data;
    this.props.updateProjectEnvironments({
      variables: { 'projectID': project.id, 'environments': form.values()['environments'] }
    }).then(({data}) => {
      this.props.data.refetch()
    });    
  }

  onUpdateProjectEnvironments(e){
    this.form.onSubmit(e, { onSuccess: this.updateProjectEnvironments.bind(this), onError: this.onError.bind(this) })
  }

  setFormValues(props){
    const { project, environments } = props.data;
    const { currentEnvironment } = props.store.app;
    var self = this;

    this.form.$('id').set(project.id)
    this.form.$('gitProtocol').set(project.gitProtocol)
    this.form.$('gitUrl').set(project.gitUrl)
    this.form.$('environmentID').set(currentEnvironment.id)
    this.form.$('gitBranch').set(project.gitBranch)      

    environments.map(function(environment){
      var checked = false
      project.environments.map(function(projectEnvironment){
        if(projectEnvironment.id === environment.id){
          checked = true
        }
        return null
      })
      self.form.$('environments').add({ 
        'grant': checked, 
        'environmentID': environment.id, 
        'label': environment.name + ' (' + environment.key +')' 
      })
      return null
    })

    this.validateUrl(project.gitUrl)
    this.setState({ settingsSet: true })
  }

  handleUrlChange(event){
    this.validateUrl(event.target.value)
  }

  handleRepoTypeChange(event){
    let urlString = this.state.url
    let msg = ""

    if(event.currentTarget.value === 'public'){
      urlString = "https://" + urlString.replace(':', '/').split("git@")[1]
      msg = "This is a valid HTTPS url."
    }

    if(event.currentTarget.value === 'private'){
      urlString = "git@" + urlString.split('https://')[1].replace('/', ':')
      msg = "This is a valid SSH url."
    }

    this.form.$('gitUrl').set(urlString)
    this.form.$('gitProtocol').set(event.currentTarget.value)
    this.setState({ repoType: event.currentTarget.value, url: urlString, msg: msg });
  }

  validateUrl(url){
    let isHTTPS = /^https:\/\/[a-z,0-9,.]+\/.+\.git$/.test(url)
    let isSSH = /^git@[a-z,0-9,.]+:.+.git$/.test(url)

    if(isHTTPS) {
      this.setState({
        previousGitUrl: this.state.url,
        repoType: "public",
        urlIsValid: true,
        url: url,
        msg: "This is a valid HTTPS url.",
      })
      return
    }

    if (isSSH) {
      this.setState({
        previousGitUrl: this.state.url,
        repoType: "private",
        urlIsValid: true,
        url: url,
        msg: "This is a valid SSH url.",
      })
      return
    }

    this.setState({
      urlIsValid: false,
      url: url,
      msg: '* URL must be a valid HTTPS or SSH url.',
      repoType: ""
    })
    return
  }

  render() {
    const { loading, user } = this.props.data;

    if(loading){
      return (<div>Loading</div>)
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
            <Card className={styles.card}>
              <CardContent>
                <Grid container spacing={24}>
                  <Grid item xs={12}>
                    <InputField disabled={true} field={this.form.$('gitUrl')} fullWidth={true}/>            
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl
                      className={styles.formControl}
                      required>
                      <FormLabel>
                        Repository Type
                      </FormLabel>
                      <RadioGroup
                        aria-label="repoType"
                        name="repoType"
                        value={this.state.value}
                        onChange={this.handleRepoTypeChange.bind(this)}
                      >
                        <FormControlLabel disabled={!this.state.urlIsValid} value="public" control={<Radio checked={this.state.repoType === 'public'} />} label="Public" />
                        <FormControlLabel disabled={!this.state.urlIsValid} value="private" control={<Radio checked={this.state.repoType === 'private'} />} label="Private" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions>
                <Button
                  disabled={!this.state.urlIsValid}
                  onClick={(e) => this.onUpdateSettings(e)}
                  variant="raised" color="primary">
                  Save
                </Button>
              </CardActions>
            </Card>
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
            <Card className={styles.card}>
              <CardContent>
                <Grid item xs={12}>
                  <InputField field={this.form.$('gitBranch')} fullWidth={true} />            
                </Grid>
              </CardContent>
              <CardActions>
                <Button color="primary"
                  type="submit"
                  variant="raised"
                  onClick={(e) => this.onUpdateSettings(e)}>
                  Save
                </Button>
              </CardActions>
            </Card>
          </Grid>                   
          {user.permissions.includes("admin") &&
            <Grid container spacing={24} style={{ padding: 10 }}>
              <Grid item sm={3}>
                <Typography variant="title" className={styles.settingsDescription}>
                  Permissions
                </Typography>
                <Typography variant="caption" className={styles.settingsCaption}>
                  Update which environments this project has access to deploy and build objects within.
                </Typography>
              </Grid>
              <Grid item sm={9}>
                <Card className={styles.card}>
                  <CardContent>
                    <Grid item xs={12}>
                      {this.form.$('environments').map(function(projectEnvironment){
                        return (
                          <CheckboxField key={projectEnvironment.id} field={projectEnvironment.$('grant')} label={projectEnvironment.$('label').value} fullWidth={true} />            
                        )
                      })}
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Button color="primary"
                      type="submit"
                      variant="raised"
                      onClick={(e) => this.onUpdateProjectEnvironments(e)}>
                      Save
                    </Button>
                  </CardActions>
                </Card>
              </Grid>                   
            </Grid>
          }
        </Grid>
      </div>
    );
  }
}
