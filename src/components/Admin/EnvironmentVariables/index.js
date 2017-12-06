import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Input from 'material-ui/Input';
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
import EnvVarSelectField from 'components/Form/envvar-select-field';
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
      version
      environment {
        id
        name
        created
      }
      versions {
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
        version
        environment {
          id
          name
          created
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
      version
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
      version
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
      version
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
    }
  }

  componentWillMount(){
    const fields = [
      'id',
      'index',
      'key',
      'value',
      'created',
      'version',
      'type',
      'scope',
      'environmentId',
      'projectId',
      'selectedVersionIndex',
    ];
    const initials = {
      'projectId': '',
      'selectedVersionIndex': '',
      'index': '',
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
      'version': 'Version',
    };
    const types = {};
    const keys = {};
    const disabled = {
      'key': false
    }

    const extra = {
      'type': [{key: 'build', value: 'Build'}, {key: 'normal', value: 'Normal' },{key: 'file', value: 'File'}],
      'scope': [{key: 'extension', value: 'Extension'}, {key: 'global', value: 'Global'}],
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
	  const environmentVariables = this.props.data.environmentVariables.filter(function(envVar){
		  if(envVar.scope === "project"){
			  return false
		  }
		  return true
	  })
    const envVar = environmentVariables[envVarIdx]
    if(envVar !== undefined){
        this.form.$('key').set(envVar.key)
        this.form.$('key').set('disabled', true)
        this.form.$('value').set(envVar.value)
        this.form.$('type').set(envVar.type)
        this.form.$('environmentId').set(envVar.environment.id)
        this.form.$('scope').set(envVar.scope)
        this.form.$('id').set(envVar.id)
        this.form.$('index').set(envVarIdx)

        this.openDrawer()
    }
  }

  onClickVersion(versionIndex){
    this.form.$('selectedVersionIndex').set(versionIndex)
    this.form.$('scope').set(this.props.data.environmentVariables[this.form.values()['index']].versions[versionIndex].scope)    
  }  

  onError(form){
    // TODO
    return
  }

  replaceEnvVarValue(e){
    this.form.$('value').set(this.props.data.environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].value);    
    this.onSubmit(e)
  }

  onSuccess(form){
    this.form.$('key').set('disabled', false)
    var self = this
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
        this.form.$('selectedVersionIndex').set('')
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
    this.form.reset()
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
    environmentVariables = environmentVariables.filter(function(envVar){
      if(envVar.scope === "project"){
        return false
      }
      return true
    })
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
                <TableCell>
                  Version
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
                    <TableCell>
                      {envVar.version}
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
                      <MenuItem selected={false} onClick={() => this.handleRequestClose("build-arg")}>Build Arg</MenuItem>
                      <MenuItem selected={false} onClick={() => this.handleRequestClose("file")}>File</MenuItem>
                      <MenuItem selected={false} onClick={() => this.handleRequestClose("normal")}>Normal</MenuItem>
                    </MenuList>
                  </Paper>
                </Grow>
              </ClickAwayListener>
            </Popper>
          </Manager>
        </div>

        <Drawer
          type="persistent"
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
                    <SelectField field={this.form.$('scope')} autoWidth={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <SelectField field={this.form.$('environmentId')} autoWidth={true} extraKey='environmentId' />
                  </Grid>

                  {(this.form.$('type').value === 'normal' || this.form.$('type').value === 'build-arg') &&
                    <Grid item xs={12}>
                      <Grid item xs={6}>
                        <InputField field={this.form.$('key')} fullWidth={true} />
                      </Grid>
                      <Grid item xs={6}>
                        <InputField field={this.form.$('value')} fullWidth={true} />
                      </Grid>
                      {this.form.values()['index'] !== '' &&
                      environmentVariables[this.form.values()['index']] != null && 
                      environmentVariables[this.form.values()['index']].versions.length > 0 &&
                      environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']] &&
                      environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].id !== this.form.values()['id'] &&
                        <Grid item xs={6}>
                          <Input value={environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].value} fullWidth={true} disabled />
                        </Grid>
                      }
                    </Grid>
                  }

                  {this.form.$('type').value === 'file' &&
                    <Grid item xs={12}>
                      <Grid item xs={5}>
                        <InputField field={this.form.$('key')} fullWidth={true} />
                      </Grid>
                      <br/>
                      <Grid item xs={5}>
                        <TextareaField field={this.form.$('value')} />
                      </Grid>                    
                      {this.form.values()['index'] !== '' &&
                      environmentVariables[this.form.values()['index']] != null && 
                      environmentVariables[this.form.values()['index']].versions.length > 0 &&
                      environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']] &&
                      environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].id !== this.form.values()['id'] &&                      
                        <Grid item xs={6}>
                          <textarea style={{ width: 300, height: 200, scrollable: 'true' }} readOnly>
                            {environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].value}
                          </textarea>
                        </Grid>
                      }
                    </Grid>
                  }
                  
                  {environmentVariables[this.form.values()['index']] != null && 
                   environmentVariables[this.form.values()['index']].versions.length > 0 &&
                   this.form.values()['selectedVersionIndex'] !== '' &&                   
                   environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].id !== this.form.values()['id'] &&                                         
                    <Grid item xs={12}>
                      <Button color="default"
                        raised onClick={this.replaceEnvVarValue.bind(this)}>
                        Revert
                      </Button>
                    </Grid>
                    }
                    
                    <br/>
 
                    <Grid item xs={12}>
                      <Button color="primary"
                        className={styles.buttonSpacing}
                        disabled={this.state.loading}
                        type="submit"
                        raised
                        onClick={e => this.onSubmit(e)}>
                        Save
                      </Button>
                      {this.form.values()['id'] !== '' &&
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

                    <br/>
                    {environmentVariables[this.form.values()['index']] != null && 
                     environmentVariables[this.form.values()['index']].versions.length > 0 &&
                     <div>
                    <Grid item xs={12}>
                      <Paper className={styles.tablePaper}>
                        <Toolbar>
                          <div>
                            <Typography type="title">
                              Version History
                            </Typography>
                          </div>
                        </Toolbar>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>
                                Version
                              </TableCell>
                              <TableCell>
                                Creator
                              </TableCell>
                              <TableCell>
                                Created At
                              </TableCell>
                              <TableCell>
                                Scope
                              </TableCell>
                              <TableCell>
                                Environment
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                             {environmentVariables[this.form.values()['index']].versions.map(function(envVar, idx){
                              return (
                                <TableRow
                                  hover
                                  tabIndex={-1}
                                  onClick={() => self.onClickVersion(idx)}
                                  key={envVar.id}>
                                  <TableCell>
                                    {envVar.version}
                                  </TableCell>
                                  <TableCell>
                                    {envVar.user.email}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(envVar.created).toString()}
                                  </TableCell>
                                  <TableCell>
                                    {envVar.scope}
                                  </TableCell>
                                  <TableCell>
                                    {envVar.environment.name}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </Paper>
                    </Grid>
                  </div>
                  }
                </Grid>
              </div>
            </form>
          </div>
        </Drawer>
        {environmentVariables.length > 0 && environmentVariables[this.form.values()['index']] &&
        <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
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
