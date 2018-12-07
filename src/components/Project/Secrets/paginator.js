
import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import { MenuItem, MenuList } from 'material-ui/Menu';
import InputField from 'components/Form/input-field';
import CheckboxField from 'components/Form/checkbox-field';
import EnvVarVersionHistory from 'components/Utils/EnvVarVersionHistory';
import styles from './style.module.css';
import { observer, inject } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql, Query } from 'react-apollo';
import gql from 'graphql-tag';
import AceEditor from 'react-ace';
import 'brace/mode/yaml';
import 'brace/theme/github';
import Loading from 'components/Utils/Loading';
import PanelTable from 'components/Utils/Table';
import jstz from 'jstimezonedetect';
import moment from 'moment';
import 'moment-timezone';
import ProtectedIcon from '@material-ui/icons/Lock';
import AddIcon from '@material-ui/icons/Add';
import MissingSecretIcon from '@material-ui/icons/Report';
import EnvVarIcon from '@material-ui/icons/ExplicitOutlined';
import FileIcon from '@material-ui/icons/Note';
import BuildArgIcon from '@material-ui/icons/Memory';
import Tooltip from 'components/Utils/Tooltip';

import { Manager, Target, Popper } from 'react-popper';
import ClickAwayListener from 'material-ui/utils/ClickAwayListener';
import Grow from 'material-ui/transitions/Grow';
import Paper from 'material-ui/Paper';

const GET_SECRET = gql`
  query Secret($id: String!) {
    secret(id: $id) {
      id
      key
      value
      isSecret
      user {
        id
        email
      }
      versions {
        value
        created
        user {
          id
          email
        }
      }
      type
      created
    }
  } 
`

@inject("store") @observer
@graphql(gql`
query Project($slug: String, $environmentID: String, $params: PaginatorInput! ){
  project(slug: $slug, environmentID: $environmentID) {
    id
    name
    secrets(params:$params) {
      count
      entries {
        id
        key
        isSecret
        user {
          id
          email
        }
        type
        created
      }
    }
  }
}`, {
  options: (props) => ({
    fetchPolicy: 'network-only',
    variables: {
      slug: props.match.params.slug,
      environmentID: props.environment.id,
      params: {
        limit: props.limit || props.store.app.paginator.limit,
        page: props.page || 0,
      },
    }
  })
})

@graphql(gql`
  mutation CreateSecret ($key: String!, $value: String!, $projectID: String!, $type: String!, $scope: String!, $isSecret: Boolean!, $environmentID: String!) {
    createSecret(secret:{
    projectID: $projectID,
    key: $key,
    value: $value,
    type: $type,
    scope: $scope,
    isSecret: $isSecret,
    environmentID: $environmentID,
    }) {
        id
        key
        value
        user {
          id
          email
        }
        project {
          id
          name
        }
        created
    }
}`, {name: "createSecret"})

@graphql(gql`
mutation UpdateSecret ($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $isSecret: Boolean!, $environmentID: String!) {
    updateSecret(secret:{
    id: $id,
    key: $key,
    value: $value,
    type: $type,
    scope: $scope,
    isSecret: $isSecret,
    environmentID: $environmentID,
    }) {
        id
        value
        user {
          id
          email
        }
        project {
          id
          name
        }
        created
    }
}`, {name: "updateSecret"})

@graphql(gql`
mutation DeleteSecret ($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $isSecret: Boolean!, $environmentID: String!) {
    deleteSecret(secret:{
    id: $id,
    key: $key,
    value: $value,
    type: $type,
    scope: $scope,
    isSecret: $isSecret,
    environmentID: $environmentID,
    }) {
        id
        key
        value
        user {
          id
          email
        }
        project {
          id
          name
        }
        created
    }
}`, {name: "deleteSecret"})

export default class SecretsPaginator extends React.Component { 
  constructor(props){
    super(props)

    this.handleNextButtonClick = this.handleNextButtonClick.bind(this)
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this)
    this.handleOutOfBounds = this.handleOutOfBounds.bind(this)
    this.onClick = this.onClick.bind(this)
    
    this.state = {
      addEnvVarMenuOpen: false,
      saving: false,
      drawerOpen: false,
      selectedSecret: null,
      selectedSecretID: null,
      dialogOpen: false,
      dirtyFormDialogOpen: false,
      limit: props.limit || this.props.store.app.paginator.limit || 7,
      page: props.page || 0,
    }
  }

  componentDidUpdate(){
      this.handleOutOfBounds()
  }

  handleOutOfBounds(){  
    const { page, limit } = this.props;
    const { loading } = this.props.data
    if (loading) {
      return
    }
    const { count } = this.props.data.project.secrets
    
    let maxPage = Math.ceil(count / limit)
    if ( page+1 > maxPage ){
      this.props.handleOutOfBounds(maxPage, limit)
    }
  }

  handleNextButtonClick() {
    const { project } = this.props.data

    let totalPages = Math.ceil(project.secrets.count / this.props.limit)
    this.props.handleNextButtonClick(totalPages)
  }

  handleBackButtonClick() {
    this.props.handleBackButtonClick()
  }

  initProjectSecretsForm(formInitials  = {}) {
    const fields = [
      'id',
      'projectID',
      'key',
      'value',
      'created',
      'type',
      'scope',
      'isSecret',
      'environmentID',
      'index',
    ]
    const rules = {
      'key': 'string|required',
      'value': 'string|required',
    }
    const labels = {
      'key': 'Key',
      'value': 'Value',
      'isSecret': 'Protected',
    }
    const initials = formInitials
    const types = {
      'isSecret': 'checkbox'
    }
    const keys = {}
    const disabled = {
      'key': false
    }
    const extra = {
      'type': [{key: 'build', value: 'Build'}, {key: 'env', value: 'Normal' },{key: 'file', value: 'File'}]
    }
    const hooks = {}
    const plugins = { dvr: validatorjs }

    return new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys }, { plugins });
  }

  handleAddClick(event){
    this.setState({ addEnvVarMenuOpen: true });
  }

  onSubmit(e) {
    this.setState({ saving: true})
    this.form.$('key').set('disabled', false)
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  onClick(idx){   
    const { project } = this.props.data
    this.openDrawer(project, idx)
  }

  componentWillMount(){
    this.form = this.initProjectSecretsForm()
  }
  shouldComponentUpdate(nextProps, nextState){
    if (JSON.stringify(this.state) !== JSON.stringify(nextState)) {
      return true
    }

    if (this.props !== nextProps) {
      return true
    }

    return false
  }

  handleDeleteEnvVar(){
    this.props.deleteSecret({
      variables: this.form.values(),
    }).then(({data}) => {
      this.closeDrawer(true)
      this.props.data.refetch()
    });
  }

  onFileEditorChange(newValue) {
    this.form.$('value').set(newValue)
  }


  onClickVersion(versions, idx) {
    this.form.$('value').set(versions[idx].value)
  }

  onError(form){
    // todo
    this.setState({ saving: false })
  }

  onSuccess(form){
    form.$('projectID').set(this.props.data.project.id)
    form.$('environmentID').set(this.props.store.app.currentEnvironment.id)
    form.$('scope').set('project')

    var self = this
    form.$('key').set('disabled', false)
    if(form.values()['id'] === ''){
      this.props.createSecret({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        self.setState()
        self.closeDrawer(true)
      });
    } else {
      this.props.updateSecret({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        form.$('key').set('disabled', true)
        form.$('id').set(data.updateSecret.id)
        form.$('value').set(data.updateSecret.value)
        self.setState({ saving: false })
        self.closeDrawer(true)
      });
    }
  }

  openDrawer(project, secretIdx){
    let secretID = null
    if (project && secretIdx) {
      secretID = project.secrets.entries[secretIdx].id
    }
    this.setState({
      addEnvVarMenuOpen: false,
      drawerOpen: true,
      saving: false,
      selectedSecretID: secretID
    })
  }

  closeDrawer(force = false){
    if(!force && this.form.isDirty){
      this.setState({ dirtyFormDialogOpen: true })
    } else {
      this.form = this.initProjectSecretsForm()
      this.setState({
        selectedSecret: null,
        selectedSecretID: null,
        drawerOpen: false,
        addEnvVarMenuOpen: false,
        saving: false,
        dialogOpen: false,
        dirtyFormDialogOpen: false
      })
    }
  } 

  handleRequestClose = value => {
    this.form = this.initProjectSecretsForm({
      'type': value,
    })
    this.form.$('key').set('disabled', false)
    this.form.$('isSecret').set('disabled', false)
    this.openDrawer()
  };

  render() {
    const { page, limit } = this.props;
    const { loading, project } = this.props.data

    let self = this
    if(loading){
      return (<Loading />)
    }

    return (
      <div>
        <PanelTable
            title={"Secrets"}
            rows={project.secrets ? project.secrets.entries : []}
            handleBackButtonClick={this.handleBackButtonClick}
            handleNextButtonClick={this.handleNextButtonClick}
            onClick={this.onClick}
            paginator={{
              count: project.secrets.count,
              page: page,
              limit: limit
            }}
            columns={[{
              label: "Key",
              getVal: function(row){return row.key},
            }, {
              label: "Type",
              getVal: function(row){
                switch(row.type){
                  case "file":
                    return (<Tooltip title="File"><FileIcon/></Tooltip>)
                  case "build":
                    return (<Tooltip title="Build Arg"><BuildArgIcon/></Tooltip>)
                  case "protected-env":
                  case "env":
                    return (<Tooltip title="Environment Variable"><EnvVarIcon/></Tooltip>)
                  default:
                    return row.type
                }
              },
            }, {
              label: "Protected",
              getVal: function(row){
                if(row.isSecret)
                  return (<Tooltip title="Protected"><ProtectedIcon/></Tooltip>)
                return ""
              },
            }, {
              label: "Creator",
              getVal: function(row){return row.user ? row.user.email : (<Tooltip title="Missing Author or Version"><MissingSecretIcon/></Tooltip>)},
            }, {
              label: "Created",
              getVal: function(row){return moment(new Date(row.created)).format("ddd, MMM Do, YYYY HH:mm:ss") + " (" + moment.tz(jstz.determine().name()).format('z') + ")"},
            }]}
          />

        <div className={styles.addButton}>
          <Manager>
            <Target>
              <Button variant="fab" aria-label="Add" type="submit" color="primary"
                aria-owns={this.state.addEnvVarMenuOpen ? 'menu-list' : null}
                aria-haspopup="true"
                onClick={this.handleAddClick.bind(this)}>
                <AddIcon />
              </Button>
            </Target>
            <Popper
              placement="bottom-start"
              eventsEnabled={this.state.addEnvVarMenuOpen}
            >
              <ClickAwayListener onClickAway={()=>this.setState({ addEnvVarMenuOpen: false })}>
                <Grow in={this.state.addEnvVarMenuOpen} id="menu-list">
                  <Paper>
                    <MenuList role="menu">
                      <MenuItem onClick={() => this.handleRequestClose("env")}><EnvVarIcon/>EnvVar</MenuItem>
                      <MenuItem onClick={() => this.handleRequestClose("build")}><BuildArgIcon/>Build Arg</MenuItem>
                      <MenuItem onClick={() => this.handleRequestClose("file")}><FileIcon/>File</MenuItem>
                    </MenuList>
                  </Paper>
                </Grow>
              </ClickAwayListener>
            </Popper>
          </Manager>
        </div>

        {this.state.drawerOpen &&
        <Query query={GET_SECRET} variables={{id: this.state.selectedSecretID}}>
          {({ loading, error, data }) => {
              if (loading) return <div></div>
              if (error) return `Error! ${error.message}`
              let secret = data.secret
              if(secret.value !== "" && !self.form.isDirty && !this.state.saving){
                this.form = this.initProjectSecretsForm({
                  'key': secret.key,
                  'value': secret.value,
                  'type': secret.type,
                  'id': secret.id,
                  'index': this.state.selectedSecretID,
                  'isSecret': secret.isSecret,
                  'projectID': project.id,
                  'environmentID': this.props.store.app.currentEnvironment.id,
                  'scope': "project",
                })
                this.form.$('key').set('disabled', true)
                this.form.$('isSecret').set('disabled', true)
              }
   
        return (<div><Drawer
            anchor="right"
            classes={{
            paper: styles.list,
            }}
            onClose={() => {this.closeDrawer()}}
            open={this.state.drawerOpen}
        >
            <div tabIndex={0} className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                  <Toolbar>
                    <Typography variant="title" color="inherit">
                        Secret
                    </Typography>
                  </Toolbar>
              </AppBar>
              <form>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24} className={styles.grid}>
                    {(this.form.$('type').value === 'env' || this.form.$('type').value === 'build') &&
                      <Grid item xs={12}>
                        <Grid item xs={12}>
                          <InputField field={this.form.$('key')} fullWidth={true} disabled={this.form.$('key').disabled} />
                        </Grid>
                        <Grid item xs={12}>
                          <InputField field={this.form.$('value')} fullWidth={true} />
                          <CheckboxField field={this.form.$('isSecret')} fullWidth={true} />
                          <Typography variant="caption"> Hide value after saving </Typography>
                        </Grid>
                      </Grid>
                    }

                    {this.form.$('type').value === 'file' &&
                      <Grid item xs={12}>
                        <Grid item xs={12}>
                          <InputField field={this.form.$('key')} fullWidth={true} />
                        </Grid>
                        <Grid item xs={12}>
                          <AceEditor
                            width="100%"
                            mode="yaml"
                            theme="github"
                            onChange={this.onFileEditorChange.bind(this)}
                            value={this.form.values()['value']}
                            name="file-content"
                            editorProps={{$blockScrolling: true}}
                            focus={true}
                          />
                          <CheckboxField field={this.form.$('isSecret')} fullWidth={true} />
                          <Typography variant="caption"> Hide value after saving </Typography>
                        </Grid>
                      </Grid>
                    }

                    {
                      <EnvVarVersionHistory
                        versions={data.secret.versions}
                        onClickVersion={this.onClickVersion.bind(this, data.secret.versions)}
                      />
                    }

                    <Grid item xs={12}>
                      <Button color="primary"
                          className={styles.buttonSpacing}
                          disabled={this.state.saving}
                          type="submit"
                          variant="raised"
                          onClick={e => this.onSubmit(e)}>
                          Save
                      </Button>

                      {this.form.values()['id'] !== "" &&
                        <Button
                          disabled={this.state.saving}
                          style={{ color: "red" }}
                          onClick={()=>this.setState({ dialogOpen: true })}>
                          Delete
                        </Button>
                      }

                      <Button
                        color="primary"
                        onClick={() => {this.closeDrawer()}}>
                        Cancel
                      </Button>
                    </Grid>
                  </Grid>
                </div>
              </form>
            </div>
          </Drawer>
        {/* Used for confirmation of escaping panel if dirty form */}
          <Dialog open={this.state.dirtyFormDialogOpen}>
            <DialogTitle>{"Are you sure you want to escape?"}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {"You'll lose any progress made so far."}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=> this.setState({ dirtyFormDialogOpen: false })} color="primary">
                Cancel
              </Button>
              <Button onClick={() => {this.closeDrawer(true)}} style={{ color: "red" }}>
                Confirm
              </Button>
            </DialogActions>
          </Dialog>

              <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
                <DialogTitle>{"Are you sure you want to delete " + secret.key + "?"}</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    {"This will delete the environment variable and all its versions."}
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
                    Cancel
                  </Button>
                  <Button onClick={this.handleDeleteEnvVar.bind(this)} style={{ color: "red" }}>
                    Confirm
                  </Button>
                </DialogActions>
              </Dialog>
          {/* } */}
        </div> )
        }}
        </Query>
        }
      </div>
    )
  }
}