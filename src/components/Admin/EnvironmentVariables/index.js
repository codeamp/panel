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
import TextareaField from 'components/Form/textarea-field';
import SelectField from 'components/Form/select-field';
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

@graphql(gql`
  query {
    environments {
      id
      name
      created
    }
    environmentVariables {
      id
      key
      value
      created
      scope
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
        id
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
mutation CreateEnvironmentVariable($key: String!, $value: String!,  $type: String!, $scope: String!, $environmentId: String!) {
  createEnvironmentVariable(environmentVariable:{
  key: $key,
  value: $value,
  type: $type,
  scope: $scope,
  environmentId: $environmentId,
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
`, { name: "createEnvironmentVariable" })


@graphql(gql`
mutation UpdateEnvironmentVariable($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $environmentId: String!) {
  updateEnvironmentVariable(environmentVariable:{
  id: $id,
  key: $key,
  value: $value,
  type: $type,
  scope: $scope,
  environmentId: $environmentId,
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
`, { name: "updateEnvironmentVariable" })

@graphql(gql`
mutation DeleteEnvironmentVariable ($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $environmentId: String!) {
  deleteEnvironmentVariable(environmentVariable:{
  id: $id,
  key: $key,
  value: $value,
  type: $type,
  scope: $scope,
  environmentId: $environmentId,
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
`, { name: "deleteEnvironmentVariable" })

@observer
export default class EnvironmentVariables extends React.Component {
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
      'environmentId',
      'projectId',
    ];
    const initials = {
      'projectId': '',
    }
    const rules = {
      'key': 'string|required',
      'value': 'string|required',
    };
    const labels = {
      'key': 'Key',
      'value': 'Value',
      'scope': 'Scope',
      'environmentId': 'Environment',
    };
    const types = {};
    const keys = {};
    const disabled = {
      'key': false
    }

    const extra = {
      'type': [{key: 'build', value: 'Build'}, {key: 'env', value: 'Normal' },{key: 'file', value: 'File'}],
      'scope': [{key: 'global', value: 'Global'}, {key: 'extension', value: 'Extension'}],
      'environmentId': [],
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

  onClick(envVarIdx){
    const envVar = this.props.data.environmentVariables[envVarIdx]
    if(envVar !== undefined){
        this.form.$('key').set(envVar.key)
        
        this.form.$('key').set('disabled', true)
        this.form.$('environmentId').set('disabled', true)
        this.form.$('scope').set('disabled', true)

        this.form.$('value').set(envVar.value)
        this.form.$('type').set(envVar.type)
        this.form.$('environmentId').set(envVar.environment.id)
        this.form.$('scope').set(envVar.scope)
        this.form.$('id').set(envVar.id)
        this.form.$('index').set(envVarIdx)

        this.openDrawer()
    }
  }

  onClickVersion(versionIdx) {
    this.form.$('value').set(this.props.data.environmentVariables[this.form.values()['index']].versions[versionIdx].value)
  }

  onError(form){
  }

  onSuccess(form){
    this.form.$('key').set('disabled', false)
    if(this.form.values()['id'] === ""){
      this.props.createEnvironmentVariable({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.form.$('key').set('disabled', false)
        this.closeDrawer()
      });
    } else {
      this.props.updateEnvironmentVariable({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.form.$('id').set(data.updateEnvironmentVariable.id)
        this.form.$('key').set('disabled', true)
        this.setState({ saving: false })
      });
    }
  }

  handleRequestClose = value => {
    this.form.reset()
    this.form.$('type').set(value);
    this.form.$('key').set('disabled', false)
    this.openDrawer()
  }

  openDrawer(){
    this.form.showErrors(false)
    this.setState({ addEnvVarMenuOpen: false, drawerOpen: true, saving: false });
  }

  closeDrawer(){
    this.form.$('key').set('disabled', false)
    this.form.$('environmentId').set('disabled', false)
    this.form.$('scope').set('disabled', false)

    this.setState({ drawerOpen: false, saving: false, dialogOpen: false, addEnvVarMenuOpen: false })
  }

  handleDeleteEnvVar(){
    if(this.form.values()['id'] !== ''){
      this.props.deleteEnvironmentVariable({
        variables: this.form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
      });
      this.setState({ dialogOpen: false })
    }
  }

  render() {
    let { loading, environmentVariables, environments } = this.props.data;

    var self = this;
    if(loading){
      return null;
    }
    const extraOptions = environments.map(function(env){
      return {
        key: env.id,
        value: env.name,
      }
    })
    this.form.state.extra({
      environmentId: extraOptions,
    })

    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <div>
              <Typography type="title">
                Environment Variables
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
              {environmentVariables.map(function(envVar, idx){
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    onClick={()=> self.onClick(idx)}
                    key={envVar.id}>
                    <TableCell>
                      {envVar.key}
                    </TableCell>
                    <TableCell>
                      {envVar.type}
                    </TableCell>
                    <TableCell>
                      {envVar.scope}
                    </TableCell>
                    <TableCell>
                      {envVar.environment.name}
                    </TableCell>
                    <TableCell>
                      {envVar.user.email}
                    </TableCell>
                    <TableCell>
                      {new Date(envVar.created).toString()}
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
              <Button fab aria-label="Add" type="submit" raised color="primary"
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
                <Typography type="title" color="inherit">
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
                    <SelectField field={this.form.$('environmentId')} fullWidth={true} extraKey='environmentId' />
                  </Grid>

                  {(this.form.$('type').value === 'env' || this.form.$('type').value === 'build') &&
                  <Grid item xs={12}>
                    <Grid item xs={12}>
                      <InputField field={this.form.$('key')} fullWidth={true} />
                    </Grid>
                    <Grid item xs={12}>
                      <InputField field={this.form.$('value')} fullWidth={true} />
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
                      <TextareaField field={this.form.$('value')} fullWidth={true} />
                    </Grid>
                  </Grid>
                  }

                  {/* Version History */}
                  {this.form.values()['index'] >= 0 && environmentVariables[this.form.values()['index']] &&
                    <EnvVarVersionHistory 
                      versions={environmentVariables[this.form.values()['index']].versions}
                      onClickVersion={this.onClickVersion.bind(this)}
                    />
                  }       

                  <Grid item xs={12}>
                    <Button color="primary"
                      className={styles.buttonSpacing}
                      disabled={this.state.loading}
                      type="submit"
                      raised
                      onClick={e => this.onSubmit(e)}>
                      Save
                    </Button>
                    {this.form.values()['id'] &&
                      <Button
                        disabled={this.state.saving}
                        color="accent"
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
        {environmentVariables.length > 0 && environmentVariables[this.form.values()['index']] &&
        <Dialog open={this.state.dialogOpen}>
          <DialogTitle>{"Are you sure you want to delete " + environmentVariables[this.form.values()['index']].key + "?"}</DialogTitle>
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
