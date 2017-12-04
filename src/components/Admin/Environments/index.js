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

<<<<<<< HEAD
@graphql(gql`
         query {
           environments {
             id
             name
             created
           }
         }
         `)
=======
const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
  }
}

@graphql(gql`
    query { 
      environments {
        id
        name
        created
      }
      environmentVariables {
        id
        environment {
          id
        }
      }
    }
`)
>>>>>>> Changes for TopNav

@graphql(gql`
         mutation CreateEnvironment($name: String!) {
           createEnvironment(environment:{
             name: $name,
           }) {
             id
             name
           }
         }
         `, { name: "createEnvironment" })

@graphql(gql`
         mutation UpdateEnvironment($id: String!, $name: String!) {
           updateEnvironment(environment:{
             id: $id,
             name: $name,
           }) {
             id
             name
           }
         }
         `, { name: "updateEnvironment" })

@graphql(gql`
         mutation DeleteEnvironment ($id: String!, $name: String!) {
           deleteEnvironment(environment:{
             id: $id,
             name: $name,
           }) {
             id
             name
           }
         }
         `, { name: "deleteEnvironment" })

@observer
export default class Environments extends React.Component {
  constructor(props){
    super(props)
    this.state = {
<<<<<<< HEAD
      saving: false,
      open: false,
    }
  }

  componentDidMount(){
    this.props.socket.on("environments/new", (data) => {
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        this.setState({ saving: false, open: false })
        this.props.store.app.setSnackbar({msg: "Environment " + data.name + " created."})
      }, 2000);
    })

    this.props.socket.on("environments/deleted", (data) => {
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        this.setState({ saving: false, open: false })
        this.props.store.app.setSnackbar({msg: "Environment " + data.name + " deleted."})
      }, 2000);
    })

    this.props.socket.on("environments/updated", (data) => {
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        this.setState({ saving: false })
        this.props.store.app.setSnackbar({msg: "Environment " + data.name + " updated."})
      }, 2000);
    })
  }

=======
      currentEnv: 0,
      loading: false,
      open: false,
      currentEnvVersion: 0,
      refreshCurrentForm: false,
    }
  }

>>>>>>> Changes for TopNav
  componentWillMount(){
    const initials = {}
    const fields = [
      'id',
      'name',
      'created',
    ];
    const rules = {
        'name': 'string|required',
    };
    const labels = {
      'name': 'Name',
    };
    const types = {
    };
    const keys = {
    };
    const disabled = {
      'name': false
    }
    const extra = {}
    const hooks = {};
    const plugins = { dvr: validatorjs };

    this.envForm = new MobxReactForm({ 
      fields, 
      rules, 
      disabled, 
      labels, 
      initials, 
      extra, 
      hooks, 
      types, 
      keys 
    }, { plugins });
  }

  onSubmit(e) {
    this.setState({ saving: true })
    this.envForm.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  onClick(envVarIdx){
<<<<<<< HEAD
=======
      console.log('onClick')
>>>>>>> Changes for TopNav
      const envVar = this.props.data.environments[envVarIdx]
      if(envVar !== undefined){
          this.envForm.$('name').set(envVar.name)
          this.envForm.$('id').set(envVar.id)
          this.setState({ open: true, currentEnv: envVarIdx, currentEnvVersion: envVarIdx, drawerText: "Update" })
      }
      this.setState({
          open: true,
          drawerText: 'Update',
      })
  }

  onError(form){
    this.setState({ saving: false, drawerText: "Create" })
  }

<<<<<<< HEAD
  replaceEnvVarValue(){
      this.envForm.$('value').set(this.props.data.environments[this.state.currentEnv].versions[this.state.currentEnvVersion].value);
  }

  onSuccess(form) {
=======
  onSuccess(form){


    console.log(form.values())

>>>>>>> Changes for TopNav
    var self = this
    if(this.state.drawerText === "Creating"){
      this.props.createEnvironment({
        variables: form.values(),
      }).then(({data}) => {
        setTimeout(function(){
            self.setState({ saving: false })
        }, 2500)
      }).catch(error => {
        console.log(error)
      });
    }

    if(this.state.drawerText === "Updating"){
      this.props.updateEnvironment({
        variables: form.values(),
      }).then(({data}) => {
        setTimeout(function(){
            self.setState({ saving: false })
        }, 2000)
      }).catch(error => {
        console.log(error)
      });
    }
  }

<<<<<<< HEAD
=======
  componentWillReceiveProps(nextProps){
    console.log('cwrp')
    console.log(this.state.currentEnv)
    this.setState({ refreshCurrentForm: true })
    console.log(nextProps)
  }

>>>>>>> Changes for TopNav
  openDrawer = value => {
    this.envForm.clear()
    this.setState({ open: true });
  };

  handleToggleDrawer(){
<<<<<<< HEAD
    this.setState({ open: !this.state.open })
=======
    this.setState({ open: !this.state.open, currentEnvVersion: 0, currentEnv: 0 })
>>>>>>> Changes for TopNav
  }

  handleDeleteEnvVar(){
    this.props.deleteAdminEnvironment({
      variables: this.envForm.values(),
    }).then(({data}) => {
      console.log(data)
    }).catch(error => {
      console.log(error)
    });
    this.setState({ dialogOpen: false })
  }

  selectEnvVarVersionId(envVarIdx){
    this.setState({ currentEnvVersion: envVarIdx })
  }

  render() {
    const { loading, environments } = this.props.data;

<<<<<<< HEAD
    if (loading) {
      return null;
    }

    var self = this;
=======
    console.log(this.props)

    const { loading, environments, environmentVariables } = this.props.data;

    if(loading){
      return (
        <div>
          Loading ...
        </div>
      )
    }

    if(this.state.refreshCurrentForm){
        this.onClick(this.state.currentEnv)
        this.setState({ refreshCurrentForm: false })
    }

    let deleteButton = "";

    if(environments.length > 0){
      deleteButton = (
        <Button
          disabled={this.state.loading || environments[this.state.currentEnv].type === "Extension Generated"}
          color="accent"
          onClick={()=>this.setState({ dialogOpen: true })}>
          Delete
        </Button>
      );
    }

    var self = this;

>>>>>>> Changes for TopNav
    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <div>
              <Typography type="title">
                Environments
              </Typography>
            </div>
          </Toolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Name
                </TableCell>
                <TableCell>
                  Created
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {environments.map(function(env, idx){
<<<<<<< HEAD
=======
                let numEnvVars = 0
                  environmentVariables.forEach(function(envVar){
                  if(envVar.environment.id === env.id){
                    numEnvVars += 1
                  }
                })

>>>>>>> Changes for TopNav
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    onClick={()=> self.onClick(idx)}
                    key={env.id}>
                    <TableCell>
                      {env.name}
                    </TableCell>
                    <TableCell>
                      {new Date(env.created).toString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>

        <Button fab aria-label="Add" type="submit" raised color="primary"
            className={styles.addButton}
            onClick={this.openDrawer.bind(this)}>
            <AddIcon />
        </Button>

        <Drawer
          type="persistent"
          anchor="right"
          classes={{
            paper: styles.list,
          }}
          open={this.state.open}
        >
<<<<<<< HEAD
          <div tabIndex={0} className={styles.createServiceBar}>
            <AppBar position="static" color="default">
              <Toolbar>
                <Typography type="title" color="inherit">
                  Environment
                </Typography>
              </Toolbar>
            </AppBar>
            <form>
              <div className={styles.drawerBody}>
                <Grid container spacing={24} className={styles.grid}>
                  <Grid item xs={12}>
                    <Grid item xs={6}>
                      <InputField field={this.envForm.$('name')} fullWidth={true} />
=======
            <div tabIndex={0} className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                  <Toolbar>
                  <Typography type="title" color="inherit">
                      {this.state.drawerText} Environment
                  </Typography>
                  </Toolbar>
              </AppBar>
              <form>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24} className={styles.grid}>
                      <Grid item xs={12}>
                        <Grid item xs={6}>
                          <InputField field={this.envForm.$('name')} fullWidth={true} />
                        </Grid>
                      </Grid>
                    <Grid item xs={12}>
                      <Button color="primary"
                          className={styles.buttonSpacing}
                          disabled={this.state.loading}
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
>>>>>>> Changes for TopNav
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Button color="primary"
                      className={styles.buttonSpacing}
                      disabled={this.state.saving}
                      type="submit"
                      raised
                      onClick={e => this.onSubmit(e)}>
                      Save
                    </Button>
                    <Button
                      color="primary"
                      onClick={this.handleToggleDrawer.bind(this)}>
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </div>
            </form>
          </div>
        </Drawer>
        {environments.length > 0 && environments[this.state.currentEnv] &&
        <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
          <DialogTitle>{"Are you sure you want to delete " + environments[this.state.currentEnv].name + "?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {"This will delete the environment and all related environment variables associated with " + environments[this.state.currentEnv].name + "."}
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
