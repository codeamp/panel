import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
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
import SelectField from 'components/Form/select-field';
import Loading from 'components/Utils/Loading';
import AddIcon from 'material-ui-icons/Add';
import styles from './style.module.css';
import { observer, inject } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Manager, Target, Popper } from 'react-popper';
import ClickAwayListener from 'material-ui/utils/ClickAwayListener';
import Grow from 'material-ui/transitions/Grow';
import EnvVarVersionHistory from 'components/Utils/EnvVarVersionHistory';
import AceEditor from 'react-ace';
import 'brace/mode/yaml';
import 'brace/theme/github';
import jstz from 'jstimezonedetect';
import moment from 'moment';
import 'moment-timezone';

import LockIcon from 'material-ui-icons/Lock';
import MissingSecretIcon from 'material-ui-icons/Report';
import EnvIcon from 'material-ui-icons/Explicit';
import FileIcon from 'material-ui-icons/Note';
import BuildArgIcon from 'material-ui-icons/Memory';
import ExtensionIcon from 'material-ui-icons/Extension';
import GlobalIcon from 'material-ui-icons/Public';

@inject("store") @observer
@graphql(gql`
  query {
    environments {
      id
      name
      created
    }
    secrets {
      count
      entries {
        id
        key
        value
        created
        scope
        isSecret
        user {
          id
          email
        }
        type
        environment {
          id
          name
          created
        }
        versions {
          value
          created
          user {
            id
            email
          }
        }
        __typename
      }
    }
  }
`)

@graphql(gql`
mutation CreateSecret($key: String!, $value: String!,  $type: String!, $scope: String!, $isSecret: Boolean!, $environmentID: String!) {
  createSecret(secret:{
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
      created
  }
}
`, { name: "createSecret" })


@graphql(gql`
mutation UpdateSecret($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $isSecret: Boolean!, $environmentID: String!) {
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
      key
      value
      user {
        id
        email
      }
      created
  }
}
`, { name: "updateSecret" })

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
      created
  }
}
`, { name: "deleteSecret" })

export default class Secrets extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      addEnvVarMenuOpen: false,
      saving: false,
      drawerOpen: false,
      dialogOpen:false,
      dirtyFormDialogOpen: false,
    }

    this.onClick = this.onClick.bind(this)
  }

  initAdminSecretsForm(formInitials = {}) {
    const fields = [
      'id',
      'index',
      'key',
      'value',
      'created',
      'type',
      'scope',
      'isSecret',
      'environmentID',
    ];
    const initials = formInitials
    const rules = {
      'key': 'string|required',
      'value': 'string|required',
    };
    const labels = {
      'key': 'Key',
      'value': 'Value',
      'scope': 'Scope',
      'environmentID': 'Environment',
      'isSecret': "Protected"
    };
    const types = {
      'isSecret': 'checkbox'
    };
    const keys = {};
    const disabled = {
      'key': false
    }

    const extra = {
      'type': [{key: 'build', value: 'Build'}, {key: 'env', value: 'Normal' },{key: 'file', value: 'File'}],
      'scope': [{key: 'global', value: 'Global'}, {key: 'extension', value: 'Extension'}],
      'environmentID': [],
    };
    const hooks = {};
    const plugins = { dvr: validatorjs };
    return new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys }, { plugins });
  }

  componentWillMount(){
    this.form = this.initAdminSecretsForm()
  }

  handleAddClick(event){
    this.setState({ addEnvVarMenuOpen: true, anchorEl: event.currentTarget });
  }

  onSubmit(e) {
    this.setState({ saving: true })
    this.form.$('key').set('disabled', false)
    this.form.$('isSecret').set('disabled', false)
    this.form.$('scope').set('disabled', false)
    this.form.$('type').set('disabled', false)
    this.form.$('environmentID').set('disabled', false)      

    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  onClick(secretIdx){
    const secret = this.props.data.secrets.entries[secretIdx]
    if(secret !== undefined){
      this.form = this.initAdminSecretsForm({
        'key': secret.key,
        'value': secret.value,
        'type': secret.type,
        'id': secret.id,
        'index': secretIdx,
        'isSecret': secret.isSecret,
        'environmentID': this.props.store.app.currentEnvironment.id,
        'scope': secret.scope,
      })

      this.form.$('key').set('disabled', true)
      this.form.$('isSecret').set('disabled', true)
      this.form.$('scope').set('disabled', true)
      this.form.$('type').set('disabled', true)
      this.form.$('environmentID').set('disabled', true)      

      this.openDrawer()
    }
  }

  onClickVersion(versionIdx) {
    this.form.$('value').set(this.props.data.secrets.entries[this.form.values()['index']].versions[versionIdx].value)
  }

  onError(form){
    return
  }

  onSuccess(form){
    this.form.$('key').set('disabled', false)
    if(this.form.values()['id'] === ""){
      this.props.createSecret({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.form.$('key').set('disabled', false)
        this.closeDrawer(true)
      });
    } else {
      this.props.updateSecret({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.form.$('id').set(data.updateSecret.id)
        this.form.$('key').set('disabled', true)
        this.setState({ saving: false })
      });
    }
  }

  handleRequestClose = value => {
    this.form = this.initAdminSecretsForm({
      'type': value,
    })
    this.form.$('key').set('disabled', false)
    this.form.$('isSecret').set('disabled', false)
    this.form.$('scope').set('disabled', false)
    this.form.$('environmentID').set('disabled', false)
    this.form.$('type').set('disabled', false)
  
    this.openDrawer()
  }

  openDrawer(){
    this.form.showErrors(false)
    this.setState({ addEnvVarMenuOpen: false, drawerOpen: true, saving: false });
  }

  closeDrawer(force = false){
    if(!force && this.form.isDirty){
      this.setState({ dirtyFormDialogOpen: true })
    } else {
      this.setState({ drawerOpen: false, addEnvVarMenuOpen: false, saving: true, dialogOpen: false, dirtyFormDialogOpen: false })    
    }
  }

  handleDeleteEnvVar(){
    if(this.form.values()['id'] !== ''){
      this.props.deleteSecret({
        variables: this.form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer(true)
      });
      this.setState({ dialogOpen: false })
    }
  }

  onFileEditorChange(newValue) {
    this.form.$('value').set(newValue)
  }

  getTypeGlyph(secret){
    switch(secret.type){
      case "file":
        return <FileIcon/>
      case "build":
        return <BuildArgIcon/>
      case "protected-env":
      case "env":
        return <EnvIcon/>
      default:
        return secret.type
    }
  }

  getScopeGlyph(secret){
    switch(secret.scope){
      case "global":
        return <GlobalIcon/>
      case "extension":
        return <ExtensionIcon/>
      default:
        return secret.scope
    }
  }

  render() {
    let { loading, secrets, environments } = this.props.data;

    var self = this;
    if(loading){
      return <Loading />;
    }
    const extraOptions = environments.map(function(env){
      return {
        key: env.id,
        value: env.name,
      }
    })
    this.form.state.extra({
      environmentID: extraOptions,
    })

    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <div>
              <Typography variant="title">
                Secrets
              </Typography>
            </div>
          </Toolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Key
                </TableCell>
                <TableCell>
                  Type
                </TableCell>
                <TableCell>
                  Protected
                </TableCell>
                <TableCell>
                  Scope
                </TableCell>
                <TableCell>
                  Environment
                </TableCell>
                <TableCell>
                  Creator
                </TableCell>
                <TableCell>
                  Created
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {secrets.entries.map(function(secret, idx){
                let emptyValue
                if (secret.value === '') {
                  emptyValue = styles.emptyValue
                }
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    onClick={()=> self.onClick(idx)}
                    key={secret.id}>
                    <TableCell className={emptyValue}>
                      {secret.key}
                    </TableCell>
                    <TableCell>
                      {self.getTypeGlyph(secret)}
                    </TableCell>
                    <TableCell>
                      {secret.isSecret ? <LockIcon/> : "" }
                    </TableCell>
                    <TableCell>
                      {self.getScopeGlyph(secret)}
                    </TableCell>
                    <TableCell>
                      {secret.environment.name}
                    </TableCell>
                    <TableCell>
                      {secret.user ? secret.user.email : <MissingSecretIcon/>}
                    </TableCell>
                    <TableCell>
                      {moment(new Date(secret.created)).format("ddd, MMM Do, YYYY HH:mm:ss") + " (" + moment.tz(jstz.determine().name()).format('z') + ")"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>

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
                      <MenuItem selected={false} onClick={() => this.handleRequestClose("env")}><EnvIcon/>EnvVar</MenuItem>
                      <MenuItem selected={false} onClick={() => this.handleRequestClose("build")}><BuildArgIcon/>Build Arg</MenuItem>
                      <MenuItem selected={false} onClick={() => this.handleRequestClose("file")}><FileIcon/>File</MenuItem>
                    </MenuList>
                  </Paper>
                </Grow>
              </ClickAwayListener>
            </Popper>
          </Manager>
        </div>

        <Drawer
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
                  Environment Variable
                </Typography>
              </Toolbar>
            </AppBar>
            <form>
              <div className={styles.drawerBody}>
                <Grid container spacing={24} className={styles.grid}>
                  <Grid item xs={12}>
                    <SelectField field={this.form.$('scope')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <SelectField field={this.form.$('environmentID')} fullWidth={true} extraKey='environmentID' />
                  </Grid>
                  
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
                    <br/>
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

                  {/* Version History */}
                  {this.form.values()['index'] >= 0 && secrets.entries[this.form.values()['index']] &&
                    <EnvVarVersionHistory 
                      versions={secrets.entries[this.form.values()['index']].versions}
                      onClickVersion={this.onClickVersion.bind(this)}
                    />
                  }       


                  <Grid item xs={12}>
                    <Button color="primary"
                      className={styles.buttonSpacing}
                      disabled={this.state.loading}
                      type="submit"
                      variant="raised"
                      onClick={e => this.onSubmit(e)}>
                      Save
                    </Button>
                    {this.form.values()['id'] &&
                      <Button
                        disabled={this.state.saving}
                        style={{ color: "red" }}
                        onClick={()=>this.setState({ dialogOpen: true })}>
                        Delete
                      </Button>
                    }
                    <Button
                      color="primary"
                      onClick={this.closeDrawer.bind(this)}>
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

        {secrets.entries.length > 0 && secrets.entries[this.form.values()['index']] &&
          <Dialog open={this.state.dialogOpen}>
            <DialogTitle>{"Are you sure you want to delete " + secrets.entries[this.form.values()['index']].key + "?"}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {"This will delete the environment variable."}
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
        }
      </div>
    )
  }
}
