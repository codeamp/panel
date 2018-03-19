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
import { observer } from 'mobx-react';
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

@graphql(gql`
  query {
    environments {
      id
      name
      created
    }
    secrets {
      id
      key
      value
      created
      scope
      isSecret
      project {
        id
      }
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

@observer
export default class Secrets extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      addEnvVarMenuOpen: false,
      saving: false,
      drawerOpen: false,
      dialogOpen:false,
    }
  }

  componentWillMount(){
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
      'projectID',
    ];
    const initials = {
      'projectID': '',
    }
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
    this.form = new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys }, { plugins });
  }

  handleAddClick(event){
    this.setState({ addEnvVarMenuOpen: true, anchorEl: event.currentTarget });
  }

  onSubmit(e) {
    this.setState({ saving: true })
    this.form.$('key').set('disabled', false)
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  onClick(secretIdx){
    const secret = this.props.data.secrets[secretIdx]
    if(secret !== undefined){
        this.form.$('key').set(secret.key)
        
        this.form.$('key').set('disabled', true)
        this.form.$('environmentID').set('disabled', true)
        this.form.$('scope').set('disabled', true)

        this.form.$('value').set(secret.value)
        this.form.$('type').set(secret.type)
        this.form.$('environmentID').set(secret.environment.id)
        this.form.$('scope').set(secret.scope)
        this.form.$('id').set(secret.id)
        this.form.$('index').set(secretIdx)
        this.form.$('isSecret').set(secret.isSecret)
        this.form.$('isSecret').set('disabled', true)

        this.openDrawer()
    }
  }

  onClickVersion(versionIdx) {
    this.form.$('value').set(this.props.data.secrets[this.form.values()['index']].versions[versionIdx].value)
  }

  onError(form){
  }

  onSuccess(form){
    this.form.$('key').set('disabled', false)
    if(this.form.values()['id'] === ""){
      this.props.createSecret({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.form.$('key').set('disabled', false)
        this.closeDrawer()
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
    this.form.reset()
    this.form.$('type').set(value);
    this.form.$('key').set('disabled', false)
    this.form.$('isSecret').set('disabled', false)
    this.openDrawer()
  }

  openDrawer(){
    this.form.showErrors(false)
    this.setState({ addEnvVarMenuOpen: false, drawerOpen: true, saving: false });
  }

  closeDrawer(){
    this.form.$('key').set('disabled', false)
    this.form.$('environmentID').set('disabled', false)
    this.form.$('scope').set('disabled', false)

    this.setState({ drawerOpen: false, saving: false, dialogOpen: false, addEnvVarMenuOpen: false })
  }

  handleDeleteEnvVar(){
    if(this.form.values()['id'] !== ''){
      this.props.deleteSecret({
        variables: this.form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
      });
      this.setState({ dialogOpen: false })
    }
  }

  onFileEditorChange(newValue) {
    this.form.$('value').set(newValue)
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
              {secrets.map(function(secret, idx){
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
                      {secret.type}
                    </TableCell>
                    <TableCell>
                      {secret.isSecret ? "yes" : "no" }
                    </TableCell>
                    <TableCell>
                      {secret.scope}
                    </TableCell>
                    <TableCell>
                      {secret.environment.name}
                    </TableCell>
                    <TableCell>
                      {secret.user.email}
                    </TableCell>
                    <TableCell>
                      {new Date(secret.created).toDateString()}
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
                      <MenuItem selected={false} onClick={() => this.handleRequestClose("build")}>Build Arg</MenuItem>
                      <MenuItem selected={false} onClick={() => this.handleRequestClose("file")}>File</MenuItem>
                      <MenuItem selected={false} onClick={() => this.handleRequestClose("env")}>Normal</MenuItem>
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
                      <InputField field={this.form.$('key')} fullWidth={true} />
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
                        focus="true"
                      />
                      <CheckboxField field={this.form.$('isSecret')} fullWidth={true} />
                      <Typography variant="caption"> Hide value after saving </Typography>
                    </Grid>
                  </Grid>
                  }

                  {/* Version History */}
                  {this.form.values()['index'] >= 0 && secrets[this.form.values()['index']] &&
                    <EnvVarVersionHistory 
                      versions={secrets[this.form.values()['index']].versions}
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
        {secrets.length > 0 && secrets[this.form.values()['index']] &&
        <Dialog open={this.state.dialogOpen}>
          <DialogTitle>{"Are you sure you want to delete " + secrets[this.form.values()['index']].key + "?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {"This will delete the environment variable."}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleDeleteEnvVar.bind(this)} color="accent">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
        }
      </div>
    )
  }
}
