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
import Menu, { MenuItem } from 'material-ui/Menu';

import InputField from 'components/Form/input-field';
import TextareaField from 'components/Form/textarea-field';

import AddIcon from 'material-ui-icons/Add';

import styles from './style.module.css';
import { observer } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
  }
}
const DEFAULT_ENV_VAR = 0

@graphql(gql`
  mutation CreateEnvironmentVariable ($key: String!, $value: String!, $projectId: String!, $type: String!, $scope: String!, $environmentId: String) {
      createEnvironmentVariable(environmentVariable:{
      projectId: $projectId,
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
          project {
            id
            name
          }
          version
          created
      }
  }
`, { name: "createEnvironmentVariable" })

@graphql(gql`
mutation UpdateEnvironmentVariable ($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $environmentId: String) {
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
        project {
          id
          name
        }
        version
        created
    }
}
`, { name: "updateEnvironmentVariable" })

@graphql(gql`
mutation DeleteEnvironmentVariable ($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $environmentId: String) {
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
        project {
          id
          name
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
      currentEnvVar: DEFAULT_ENV_VAR,
      drawerText: "Create",
      addEnvVarMenuOpen: false,
      loading: false,
      open: false,
      currentEnvVarVersion: DEFAULT_ENV_VAR,
      refreshCurrentForm: false,
    }
  }

  componentWillMount(){
    const fields = [
      'id',
      'projectId',
      'key',
      'value',
      'created',
      'version',
      'type',
      'scope',
      'environmentId',
    ];

    const rules = {
    'key': 'string|required',
    'value': 'string|required',
    };

    const labels = {
      'key': 'Key',
      'value': 'Value',
      'version': 'Version',
    };

    const initials = {
    }

    const types = {
    };

    const keys = {
    };

    const disabled = {
      'key': false
    }

    const extra = {
      'type': [{key: 'Build', value: 'Build'}, {key: 'Normal', value: 'Normal' },{key: 'File', value: 'File'}]
    };

    const hooks = {
    };

    const plugins = { dvr: validatorjs };

    this.envVarForm = new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys }, { plugins });
  }

  handleAddClick(event){
    this.setState({ addEnvVarMenuOpen: true, anchorEl: event.currentTarget, currentService: { id: -1 }, drawerText: 'Create' });
  }

  onSubmit(e) {
    let drawerText = ""
    if(this.state.drawerText === "Create"){
      drawerText = "Creating"
    }
    if(this.state.drawerText === "Update"){
      drawerText = "Updating"
    }

    this.setState({ loading: true, drawerText: drawerText })

    this.envVarForm.$('key').set('disabled', false)

    console.log(this.envVarForm.values())

    this.envVarForm.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  onClick(envVarIdx){
    const envVar = this.props.project.environmentVariables[envVarIdx]
    if(envVar !== undefined){
        this.envVarForm.$('key').set(envVar.key)
        this.envVarForm.$('key').set('disabled', true)
        this.envVarForm.$('value').set(envVar.value)
        this.envVarForm.$('type').set(envVar.type)
        this.envVarForm.$('id').set(envVar.id)
        this.setState({ open: true, currentEnvVar: envVarIdx,  drawerText: "Update" })
    }
  }

  onError(form){
    let drawerText = ""

    if(this.state.drawerText === "Creating"){
      drawerText = "Create"
    }

    this.setState({ loading: false, drawerText: drawerText })
  }

  replaceEnvVarValue(){
    this.envVarForm.$('value').set(this.props.project.environmentVariables[this.state.currentEnvVar].versions[this.state.currentEnvVarVersion].value);
  }

  onSuccess(form){


    form.$('projectId').set(this.props.project.id)
    form.$('scope').set('project')
    console.log(form.values())

    this.envVarForm.$('key').set('disabled', false)
    var self = this
    if(this.state.drawerText === "Creating"){
      this.props.createEnvironmentVariable({
        variables: form.values(),
      }).then(({data}) => {
        console.log(data)
        setTimeout(function(){
            self.setState({ drawerText: "Update", loading: false })
        }, 2500)
      }).catch(error => {
        console.log(error)
      });
    }

    if(this.state.drawerText === "Updating"){
      this.props.updateEnvironmentVariable({
        variables: form.values(),
      }).then(({data}) => {
        setTimeout(function(){
            self.setState({ drawerText: "Update", loading: false })
        }, 2000)
        console.log(data)
      }).catch(error => {
        console.log(error)
      });
    }
  }

  componentWillReceiveProps(nextProps){
      console.log('cwrp')
      console.log(this.state.currentEnvVar)
      this.setState({ refreshCurrentForm: true })
      console.log(nextProps)
  }

  handleRequestClose = value => {
    this.envVarForm.clear()
    this.envVarForm.$('type').set(value);
    this.envVarForm.$('key').set('disabled', false)
    this.setState({ addEnvVarMenuOpen: false, open: true, currentEnvVar: -1});
  };

  isEnvVarVersionIdSelected(envVarId){
    if(this.props.project.environmentVariables[this.state.currentEnvVar].versions !== undefined &&
       this.props.project.environmentVariables[this.state.currentEnvVar].versions[this.state.currentEnvVarVersion]
        ){
        return this.props.project.environmentVariables[this.state.currentEnvVar].versions[this.state.currentEnvVarVersion].id === envVarId;
    }
    return false
  }

  isSelected(id){
    return this.state.selected === id;
  }

  handleToggleDrawer(){
    this.setState({ open: !this.state.open, currentEnvVarVersion: DEFAULT_ENV_VAR, currentEnvVar: DEFAULT_ENV_VAR })
  }

  handleDeleteEnvVar(){
    this.props.deleteEnvironmentVariable({
      variables: this.envVarForm.values(),
    }).then(({data}) => {
      console.log(data)
    }).catch(error => {
      console.log(error)
    });
    this.setState({ dialogOpen: false })
  }

  selectEnvVarVersionId(envVarIdx){
    this.setState({ currentEnvVarVersion: envVarIdx })
  }

  render() {

    const { environmentVariables } = this.props.project;

    if(this.state.refreshCurrentForm){
        this.onClick(this.state.currentEnvVar)
        this.setState({ refreshCurrentForm: false })
    }

    console.log(this.props.project)
    console.log(environmentVariables)
    console.log(environmentVariables[this.state.currentEnvVar])

    let deleteButton = "";

    if(environmentVariables.length > 0 && environmentVariables[this.state.currentEnvVar] && environmentVariables[this.state.currentEnvVar].id !== -1){
      deleteButton = (
        <Button
          disabled={this.state.loading || environmentVariables[this.state.currentEnvVar].type === "Extension Generated"}
          color="accent"
          onClick={()=>this.setState({ dialogOpen: true })}>
          Delete
        </Button>
      );
    }

    var self = this;
    console.log(environmentVariables)
    console.log(this.state.currentEnvVarVersion)

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
          <Table bodyStyle={{ overflow: 'visible' }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  Key
                </TableCell>
                <TableCell>
                  Type
                </TableCell>
                <TableCell>
                  Creator
                </TableCell>
                <TableCell>
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

        <Button fab aria-label="Add" type="submit" raised color="primary"
            style={inlineStyles.addButton}
            onClick={this.handleAddClick.bind(this)}>
            <AddIcon />
        </Button>

        <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={this.state.addEnvVarMenuOpen}
            onRequestClose={this.handleRequestClose}
        >
          <MenuItem onClick={() => this.handleRequestClose("normal")}>Normal</MenuItem>
          <MenuItem onClick={() => this.handleRequestClose("build-arg")}>Build Arg</MenuItem>
          <MenuItem onClick={() => this.handleRequestClose("file")}>File</MenuItem>
        </Menu>

        <Drawer
            type="persistent"
            anchor="right"
            classes={{
            paper: styles.list,
            }}
            open={this.state.open}
        >
            <div tabIndex={0} className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                  <Toolbar>
                  <Typography type="title" color="inherit">
                      {this.state.drawerText} Environment Variable
                  </Typography>
                  </Toolbar>
              </AppBar>
              <form>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24} className={styles.grid}>
                    {this.envVarForm.$('type').value === 'normal' &&
                      <Grid item xs={12}>
                        <Grid item xs={6}>
                          <InputField field={this.envVarForm.$('key')} fullWidth={true} />
                        </Grid>
                        <Grid item xs={6}>
                          <InputField field={this.envVarForm.$('value')} fullWidth={true} />
                        </Grid>
                        {environmentVariables.length > 0 && environmentVariables[this.state.currentEnvVar] && environmentVariables[this.state.currentEnvVar].versions && environmentVariables[this.state.currentEnvVar].versions[this.state.currentEnvVarVersion].id !== -1 &&
                          <Grid item xs={6}>
                            <Input value={environmentVariables[this.state.currentEnvVar].versions[this.state.currentEnvVarVersion].value} fullWidth={true} disabled />
                          </Grid>
                        }
                      </Grid>
                    }

                    {this.envVarForm.$('type').value === 'file' &&
                      <Grid item xs={12}>
                        <Grid item xs={5}>
                          <InputField field={this.envVarForm.$('key')} fullWidth={true} />
                        </Grid>
                        <br/>
                        <Grid item xs={5}>
                          <TextareaField field={this.envVarForm.$('value')} />
                        </Grid>
                        {environmentVariables.length > 0 && environmentVariables[this.state.currentEnvVar] && environmentVariables[this.state.currentEnvVar].versions && environmentVariables[this.state.currentEnvVar].versions[this.state.currentEnvVarVersion].id !== -1 &&
                          <Grid item xs={6}>
                            <textarea style={{ width: 300, height: 200, scrollable: 'true' }} readOnly>
                              {environmentVariables[this.state.currentEnvVar].versions[this.state.currentEnvVarVersion].value}
                            </textarea>
                          </Grid>
                        }
                      </Grid>
                    }

                    {environmentVariables.length > 0 && environmentVariables[this.state.currentEnvVar] && environmentVariables[this.state.currentEnvVar].versions && environmentVariables[this.state.currentEnvVar].versions[this.state.currentEnvVarVersion] && environmentVariables[this.state.currentEnvVar].versions[this.state.currentEnvVarVersion].id !== -1 &&
                      <Grid item xs={12}>
                        <Button color="default"
                          disabled={environmentVariables[this.state.currentEnvVar].versions[this.state.currentEnvVarVersion].value === this.envVarForm.$('value').value}
                          raised onClick={this.replaceEnvVarValue.bind(this)}>
                          Use It
                        </Button>
                      </Grid>
                    }
                    <Grid item xs={12}>
                      <Button color="primary"
                          className={styles.buttonSpacing}
                          disabled={this.state.loading || environmentVariables.length > 0 && environmentVariables[this.state.currentEnvVar] && this.envVarForm.$('value').value === environmentVariables[this.state.currentEnvVar].value}
                          type="submit"
                          raised
                          onClick={e => this.onSubmit(e)}>
                            {this.state.drawerText}
                      </Button>
                      { deleteButton }
                      <Button
                        color="primary"
                        onClick={this.handleToggleDrawer.bind(this)}>
                        Cancel
                      </Button>
                    </Grid>
                    {environmentVariables.length > 0 && environmentVariables[this.state.currentEnvVar] && environmentVariables[this.state.currentEnvVar].id !== -1 &&
                      <Grid item xs={12}>
                          <Paper className={styles.tablePaper}>
                          <Toolbar>
                            <div>
                              <Typography type="title">
                                Version History
                              </Typography>
                            </div>
                          </Toolbar>
                          <Table bodyStyle={{ overflow: 'visible' }}>
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
                              </TableRow>
                            </TableHead>
                            <TableBody>
                            {environmentVariables[this.state.currentEnvVar] && environmentVariables[this.state.currentEnvVar].versions.map(function(envVar, idx){
                              const isSelected = self.isEnvVarVersionIdSelected(envVar.id);

                              return (
                                <TableRow
                                  hover
                                  selected={isSelected}
                                  tabIndex={-1}
                                  onClick={() => self.selectEnvVarVersionId(idx)}
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
                              </TableRow>
                              )
                            })}
                            </TableBody>
                          </Table>
                        </Paper>
                      </Grid>
                    }
                  </Grid>
                </div>
              </form>
            </div>
        </Drawer>
        {environmentVariables.length > 0 && environmentVariables[this.state.currentEnvVar] &&
            <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
              <DialogTitle>{"Are you sure you want to delete " + environmentVariables[this.state.currentEnvVar].key + "?"}</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {"This will delete the environment variable and all its versions associated with" + this.props.project.name + "."}
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
