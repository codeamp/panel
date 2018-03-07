import React from 'react';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import AddIcon from 'material-ui-icons/Add';
import CloseIcon from 'material-ui-icons/Close';
import InputField from 'components/Form/input-field';
import SelectField from 'components/Form/select-field';
import EnvVarSelectField from 'components/Form/envvar-select-field';
import Loading from 'components/Utils/Loading';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  }
}

@graphql(gql`
query {
  extensions {
    id
    type
    key
    name
    component
    environment {
      id
      name
    }
    config
  }
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
    type
    environment {
      id
      name
      created
    }
  }
}
`)

@graphql(gql`
mutation CreateExtension ($name: String!, $key: String!, $type: String!, $environmentID: String!, $config: JSON!, $component: String!) {
    createExtension(extension:{
      name: $name,
      key: $key,
      type: $type,
      environmentID: $environmentID,
      config: $config,
      component: $component,
    }) {
        id
        name
    }
}
`, { name: "createExtension" })


@graphql(gql`
mutation UpdateExtension ($id: String, $name: String!, $key: String!, $type: String!, $environmentID: String!, $config: JSON!, $component: String!) {
    updateExtension(extension:{
      id: $id,
      name: $name,
      key: $key,
      type: $type,
      environmentID: $environmentID,
      config: $config,
      component: $component,
    }) {
        id
        name
    }
}
`, { name: "updateExtension" })


@graphql(gql`
mutation DeleteExtension ($id: String, $name: String!, $key: String!, $type: String!, $environmentID: String!, $config: JSON!, $component: String!) {
    deleteExtension(extension:{
      id: $id,
      name: $name,
      key: $key,
      type: $type,
      environmentID: $environmentID,
      config: $config,
      component: $component,
    }) {
        id
        name
    }
}
`, { name: "deleteExtension" })



@inject("store") @observer

export default class Extensions extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      drawerOpen: false,
    }
  }

  componentWillMount(){
    const fields = [
      'id',
      'index',
      'name',
      'key',
      'type',
      'config',
      'config[]',
      'config[].key',
      'config[].value',
      'environmentID',
      'component',
    ];
    const rules = {
      'name': 'required|string',
      'key': 'required|string',
      'type': 'required',
      'config[].key': 'required|string',
      'config[].value': 'required|string',
      'component': 'required|string',
    };
    const labels = {
      'name': 'Name',
      'key': 'Key',
      'type': 'Type',
      'config': 'Config',
      'config[].key': 'Key',
      'config[].value': 'Value',
      'component': 'React Component',
      'environmentID': 'Environment',
    };
    const initials = {
      'type': 'Workflow',
      'environmentID': null,
    };

    const types = {
    };
    const extra = {
      'type': [{
        key: 'deployment',
        value: 'Deployment',
      }, {
        key: 'workflow',
        value: 'Workflow',
      }, {
        key: 'notification',
        value: 'Notification',
      }, {
        key: 'once',
        value: 'Once',
      }],
    };

    const hooks = {};
    const handlers = {};
    const plugins = { dvr: validatorjs };
    this.form = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { handlers }, { plugins })
  }

  openDrawer(){
    this.form.showErrors(false)
    this.setOptions()
    this.setState({ drawerOpen: true, dialogOpen: false })
  }

  closeDrawer(){
    this.form.reset()
    this.setState({ drawerOpen: false, dialogOpen: false, saving: false })
  }

  handleClick(e, extension, index){
    this.form.$('id').set(extension.id)
    this.form.$('index').set(index)
    this.form.$('name').set(extension.name)
    this.form.$('key').set(extension.key)
    this.form.$('environmentID').set(extension.environment.id)
    this.form.update({ config: extension.config })
    this.form.$('component').set(extension.component)
    this.form.$('type').set(extension.type)
    this.openDrawer()
  }

  onSuccess(form){
    this.setState({ saving: true })
    if(this.form.values().id === ''){
      this.props.createExtension({
        variables: this.form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
      });
    } else {
      this.props.updateExtension({
        variables: this.form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
      });
    }
  }

  handleDeleteExtension() {
    this.setState({ saving: true })
    var that = this
    this.props.deleteExtension({
      variables: this.form.values(),
    }).then(({ data }) => {
      this.props.data.refetch()
      that.closeDrawer()
    });
  }

  onError(){
    return
  }

  onSubmit(e){
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  setOptions(){
    const { secrets, environments } = this.props.data    
    // filter secrets by env of current extension if exists
    var self = this
    var envSecrets = secrets
    if(this.form.$('environmentID').value){
      envSecrets = secrets.filter(function(secret){
        if(self.form.$('environmentID').value === secret.environment.id){
          return true
        }
        return false
      })
    }

    var secretOptions = []
    secretOptions = envSecrets.map(function(secret){
      return {
        key: secret.id,
        value: "(" + secret.key + ") => " + secret.value,
      }
    })

    var envOptions = []
    envOptions = environments.map(function(env){
      return {
        key: env.id,
        value: env.name,
      }
    })    

    this.form.state.extra({
      config: secretOptions,
      environmentID: envOptions,      
    })    
  }

  render() {
    const { loading, extensions } = this.props.data;

    if(loading){
      return (
        <Loading />
      )
    }    

    return (
      <div className={styles.root}>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <Paper>
              <Toolbar>
                <div>
                  <Typography variant="title">
                    Extensions
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
                      Environment
                    </TableCell>
                    <TableCell>
                      Type
                    </TableCell>
                    <TableCell>
                      Component
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {extensions.map( (extension, index) => {
                    return (
                      <TableRow
                        hover
                        onClick={event => this.handleClick(event, extension, index)}
                        tabIndex={-1}
                        key={extension.id}>
                        <TableCell> { extension.name} </TableCell>
                        <TableCell> { extension.environment ? extension.environment.name : '' } </TableCell>
                        <TableCell> { extension.type } </TableCell>
                        <TableCell> { extension.component } </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
        <Button variant="fab" aria-label="Add" type="submit" color="primary"
              style={inlineStyles.addButton}
              onClick={this.openDrawer.bind(this)}>
              <AddIcon />
        </Button>
        <Drawer
          anchor="right"
          classes={{
            paper: styles.drawer
          }}
          open={this.state.drawerOpen}
        >
            <div className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                <Toolbar>
                  <Typography variant="title" color="inherit">
                    Extensions
                  </Typography>
                </Toolbar>
              </AppBar>
              <form onSubmit={(e) => e.preventDefault()}>
                <Grid container spacing={24} className={styles.grid}>
                  <Grid item xs={12}>
                    <InputField field={this.form.$('name')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <InputField field={this.form.$('key')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <SelectField field={this.form.$('environmentID')} fullWidth={true} extraKey='environmentID'/>
                  </Grid>
                  <Grid item xs={12}>
                    <SelectField field={this.form.$('type')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <InputField field={this.form.$('component')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="title">Config</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    {this.form.$('config').map((kv) => {
                        return (
                        <Grid container spacing={24} key={kv.id}>
                            <Grid item xs={5}>
                                <InputField field={kv.$('key')} fullWidth={true} />
                            </Grid>
                            <Grid item xs={5}>
                                <EnvVarSelectField field={kv.$('value')} fullWidth={true} extraKey="config" />
                            </Grid>
                            <Grid item xs={1}>
                            <IconButton>
                                <CloseIcon onClick={kv.onDel} />
                            </IconButton>
                            </Grid>
                        </Grid>
                        )
                    })}
                    <Button color="default" variant="raised" onClick={this.form.$('config').onAdd}>
                      Add Config
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button color="primary"
                        className={styles.buttonSpacing}
                        disabled={this.state.saving}
                        type="submit"
                        variant="raised"
                        onClick={this.onSubmit.bind(this)}>
                          Save
                    </Button>

                    {this.form.values()['id'] !== '' &&
                      <Button
                        disabled={this.state.saving}
                        style={{ color: "red" }}
                        onClick={()=>this.setState({ dialogOpen: true })}>
                        Delete
                      </Button>
                    }

                    <Button
                      onClick={this.closeDrawer.bind(this)}>
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </div>
        </Drawer>
        {extensions[this.form.values()['index']] != null &&
          <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
            <DialogTitle>{"Ae you sure you want to delete " + extensions[this.form.values()['index']].name + "?"}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                This will delete the extension spec.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
                Cancel
              </Button>
              <Button onClick={this.handleDeleteExtension.bind(this)} color="accent">
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        }

      </div>
    );
  }
}
