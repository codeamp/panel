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
      rsaPublicKey
      gitProtocol
      gitBranch
      continuousDeploy
      environments {
        id
        name
        key
        color
        created
      }
      bookmarked
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
  mutation Mutation($id: String!, $gitProtocol: String!, $gitUrl: String!,  $environmentID: String, $gitBranch: String, $continuousDeploy: Boolean) {
    updateProject(project: { id: $id, gitProtocol: $gitProtocol, gitUrl: $gitUrl, environmentID: $environmentID, gitBranch: $gitBranch, continuousDeploy: $continuousDeploy}) {
      id
      name
      slug
      repository
      gitUrl
      gitBranch
      gitProtocol
      continuousDeploy
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
      repositorySettingsSaving: false,
      branchSettingsSaving: false,
      permissionsSaving: false,
      automationSaving: false,
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
      'continuousDeploy',
    ];
    const rules = {};
    const labels = {
      'gitBranch': 'Git Branch',
      'gitUrl': 'Git Url',
      'continuousDeploy': 'Continuous Deploy',
    };
    const initials = {
    };
    const types = {
      'environments[].grant': 'checkbox',
      'continuousDeploy': 'checkbox',
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
    if(!this.state.settingsSet){	
      this.setFormValues(nextProps)
    }
  } 

  updateProject(form){
    this.props.updateProject({
      variables: form.values(),
    }).then(({data}) => {
      this.setState({ automationSaving: false, branchSettingsSaving: false, repositorySettingsSaving: false })
      this.props.store.app.setSnackbar({ open: true, msg: this.props.store.app.currentEnvironment.name + " settings saved successfully."})
      this.props.data.refetch()
    });
  }

  onError(form){
    console.log('onError')
  }

  onUpdateSettings(e, settingsSection){
    switch(settingsSection){
      case "repositorySettings":
        this.setState({ repositorySettingsSaving: true })
        break
      case "branchSettings":
        this.setState({ branchSettingsSaving: true })
        break
      case "automation":
        this.setState({ automationSaving: true })
        break 
    }
    this.form.onSubmit(e, { onSuccess: this.updateProject.bind(this), onError: this.onError.bind(this) })
  }

  updateProjectEnvironments(form){
    const { project } = this.props.data;
    this.props.updateProjectEnvironments({
      variables: { 'projectID': project.id, 'environments': form.values()['environments'] }
    }).then(({data}) => {
      this.setState({ permissionsSaving: false })
      this.props.store.app.setSnackbar({ open: true, msg: this.props.store.app.currentEnvironment.name + " permissions saved successfully" })
      this.props.data.refetch()
    });    
  }

  onUpdateProjectEnvironments(e){
    this.setState({ permissionsSaving: true })
    this.form.onSubmit(e, { onSuccess: this.updateProjectEnvironments.bind(this), onError: this.onError.bind(this) })
  }

  setFormValues(props) {
    const { project, environments, loading } = props.data;
    const { currentEnvironment } = props.store.app;

    if(loading){
      return null
    }

    this.form.$('id').set(project.id)
    this.form.$('gitProtocol').set(project.gitProtocol)
    this.form.$('gitUrl').set(project.gitUrl)
    this.form.$('environmentID').set(currentEnvironment.id)
    this.form.$('gitBranch').set(project.gitBranch)      
    this.form.$('continuousDeploy').set(project.continuousDeploy)      

    environments.map((environment) => {
      var checked = false
      project.environments.map((projectEnvironment) =>{
        if(projectEnvironment.id === environment.id){
          checked = true
        }
        return null
      })
      this.form.$('environments').add([{ 
        'grant': checked, 
        'environmentID': environment.id, 
        'label': environment.name + ' (' + environment.key +')' 
      }])
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
      return null
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
                  disabled={this.state.repositorySettingsSaving}
                  onClick={(e) => this.onUpdateSettings(e, "repositorySettings")}
                  variant="raised" color="primary">
                  Save
                </Button>
              </CardActions>
            </Card>
          </Grid>  
          {this.state.repoType === "private" &&
            <Grid container style={{ margin: 1 }}>
              <Grid item sm={3}>
                <Typography variant="title" className={styles.settingsDescription}>
                  Deploy Key Setup
                </Typography>
                <Typography variant="caption" className={styles.settingsCaption}>
                  Instructions for setting up a private project.
                </Typography>            
              </Grid>
              <Grid item sm={9}>
                  <Card className={styles.card} raised={false} style={{ width: "98%" }}>
                  <CardContent>
                    <Typography type="headline" component="h2">
                      Setup the Git Deploy Key
                    </Typography>
                    <br/>
                    <Typography
                      id="ssh-key"
                      component="p" className={styles.codeSnippet}>
                      {this.props.data.project.rsaPublicKey}
                    </Typography>
                    <br/><br/>
                    <Typography variant="body1">
                      <a href="https://developer.github.com/v3/guides/managing-deploy-keys/#deploy-keys">
                        Click here to learn how to add deploy keys to Github.
                      </a>
                    </Typography>
                  </CardContent>
                </Card>          
              </Grid>
            </Grid>
          }
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
                  disabled={this.state.branchSettingsSaving}
                  onClick={(e) => this.onUpdateSettings(e, "branchSettings")}>
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
                      {this.form.$('environments').map((projectEnvironment) => {
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
                      disabled={this.state.permissionsSaving}
                      onClick={(e) => this.onUpdateProjectEnvironments(e)}>
                      Save
                    </Button>
                  </CardActions>
                </Card>
              </Grid>                   
            </Grid>
          }
          <Grid container spacing={24} style={{ padding: 10 }}>
            <Grid item sm={3}>
              <Typography variant="title" className={styles.settingsDescription}>
                Automation
              </Typography>
              <Typography variant="caption" className={styles.settingsCaption}>
                Check whether you want new features to automatically deploy. This only applies for the given environment.
              </Typography>
            </Grid>
            <Grid item sm={9}>
              <Card className={styles.card}>
                <CardContent>
                  <Grid item xs={12}>
                    <CheckboxField field={this.form.$('continuousDeploy')} label={this.form.$('continuousDeploy').label} fullWidth={true} />            
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button color="primary"
                    type="submit"
                    variant="raised"
                    disabled={this.state.automationSaving}
                    onClick={(e) => this.onUpdateSettings(e, "automation")}>
                    Save
                  </Button>
                </CardActions>
              </Card>
            </Grid>                   
          </Grid>
        </Grid>
      </div>
    );
  }

}
