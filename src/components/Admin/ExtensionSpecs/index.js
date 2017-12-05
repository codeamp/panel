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
  extensionSpecs {
    id
    type
    key
    name
    component
    formSpec {
      key
      value
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
  environmentVariables {
    id
    key
    value
    created
    scope
    type
    version
    environment {
      id
      name
      created
    }
  }
}
`)

@graphql(gql`
mutation CreateExtensionSpec ($name: String!, $key: String!, $type: String!, $formSpec: [KeyValueInput!]!, $environmentVariables: [String!]!, $component: String!) {
    createExtensionSpec(extensionSpec:{
    name: $name,
    key: $key,
    type: $type,
    formSpec: $formSpec,
    environmentVariables: $environmentVariables,
    component: $component,
    }) {
        id
        name
    }
}
`, { name: "createExtensionSpec" })


@graphql(gql`
mutation UpdateExtensionSpec ($id: String, $name: String!, $key: String!, $type: String!, $formSpec: [KeyValueInput!]!, $environmentVariables: [String!]!, $component: String!) {
    updateExtensionSpec(extensionSpec:{
    id: $id,
    name: $name,
    key: $key,
    type: $type,
    formSpec: $formSpec,
    environmentVariables: $environmentVariables,
    component: $component,
    }) {
        id
        name
    }
}
`, { name: "updateExtensionSpec" })


@graphql(gql`
mutation DeleteExtensionSpec ($id: String, $name: String!, $key: String!, $type: String!, $formSpec: [KeyValueInput!]!, $environmentVariables: [String!]!, $component: String!) {
    deleteExtensionSpec(extensionSpec:{
    id: $id,
    name: $name,
    key: $key,
    type: $type,
    formSpec: $formSpec,
    environmentVariables: $environmentVariables,
    component: $component,
    }) {
        id
        name
    }
}
`, { name: "deleteExtensionSpec" })



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
      'formSpec',
      'formSpec[]',
      'formSpec[].key',
      'formSpec[].value',
      'environmentVariables',
      'environmentVariables[]',
      'environmentVariables[].envVar',
      'component',
    ];
    const rules = {
      'name': 'required|string',
      'key': 'required|string',
      'type': 'required',
      'formSpec[].key': 'required|string',
      'formSpec[].value': 'required|string',
      'component': 'required|string',
    };
    const labels = {
      'name': 'Name',
      'key': 'Key',
      'type': 'Type',
      'formSpec': "Form Specification",
      'formSpec[].key': 'Key',
      'formSpec[].value': 'Value',
      'environmentVariables[].envVar': 'Env. Var',
      'component': 'Component Name',
    };
    const initials = {
      'type': 'Workflow',
      'environmentVariables':[],
      'formSpec':[],
      'index': '',
    };
    const types = {};
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
    const handlers = {}
    const plugins = { dvr: validatorjs };
    this.form = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { handlers }, { plugins })
  }

  openDrawer(){
    this.form.showErrors(false)
    this.setState({ drawerOpen: true, dialogOpen: false })
  }

  closeDrawer(){
    this.form.reset()
    this.setState({ drawerOpen: false, dialogOpen: false, saving: false })
  }

  handleClick(e, extension, index){
	  const envVars = extension.environmentVariables.map(function(envVar){
      return {
        'envVar': envVar.id,
      }
	  })

    this.form.$('id').set(extension.id)
    this.form.$('index').set(index)
    this.form.$('name').set(extension.name)
    this.form.$('key').set(extension.key)
    this.form.update({ formSpec: extension.formSpec })
    this.form.$('component').set(extension.component)
    this.form.$('type').set(extension.type)
	  this.form.update({ environmentVariables: envVars})
    
    this.openDrawer()
  }

  onSuccess(form){
    this.setState({ saving: true })
    if(this.form.values()['id'] === ''){
      this.props.createExtensionSpec({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
      });
    } else {
      this.props.updateExtensionSpec({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
      });
    }
  }

  handleDeleteExtension() {
    this.setState({ saving: true })
    var that = this
    this.props.deleteExtensionSpec({
      variables: this.form.values(),
    }).then(({ data }) => {
      this.props.data.refetch()
      that.closeDrawer() 
    });
  }

  onError(){
    //todo 
    return
  }

  onSubmit(e){
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  render() {
    const { loading, extensionSpecs, environmentVariables } = this.props.data;

    if(loading){
      return (
        <div>
          Loading ...
        </div>
      )
    }

    var self = this


    const envVarOptions = environmentVariables.map(function(envVar){
      return {
        key: envVar.id,
        value: "(" + envVar.key + ") => " + envVar.value,
      }
    })
    this.form.state.extra({
      environmentVariables: envVarOptions,
    })

    return (
      <div className={styles.root}>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <Paper>
              <Toolbar>
                <div>
                  <Typography type="title">
                    Extension Specs
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
                      Type
                    </TableCell>
                    <TableCell>
                      Component
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {extensionSpecs.map( (extension, index) => {
                    return (
                      <TableRow
                        hover
                        onClick={event => this.handleClick(event, extension, index)}
                        tabIndex={-1}
                        key={extension.id}>
                        <TableCell> { extension.name} </TableCell>
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
        <Button fab aria-label="Add" type="submit" raised color="primary"
              style={inlineStyles.addButton}
              onClick={this.openDrawer.bind(this)}>
              <AddIcon />
        </Button>
        <Drawer
          type="persistent"
          anchor="right"
          classes={{
            paper: styles.drawer
          }}
          open={this.state.drawerOpen}
        >
            <div className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                <Toolbar>
                  <Typography type="title" color="inherit">
                    Extension Spec
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
                    <SelectField field={this.form.$('type')} autoWidth={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <InputField field={this.form.$('component')} fullWith={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography type="subheading"> Form Specification Rules </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    {this.form.$('formSpec').map(function(kv){
                        return (
                        <Grid container spacing={24}>
                            <Grid item xs={4}>
                                <InputField field={kv.$('key')} fullWidth={false} className={styles.containerPortFormInput} />
                            </Grid>
                            <Grid item xs={5}>
                                <InputField field={kv.$('value')} fullWidth={false} className={styles.containerPortFormInput} />
                            </Grid>
                            <Grid item xs={1}>
                            <IconButton>
                                <CloseIcon onClick={kv.onDel} />
                            </IconButton>
                            </Grid>
                        </Grid>
                        )
                    })}
                    <Button raised type="secondary" onClick={this.form.$('formSpec').onAdd}>
                      Add rule
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography type="subheading"> Environment Variables </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    {this.form.$('environmentVariables').map(function(kv){
                        return (
                        <Grid container spacing={24}>
                            <Grid item xs={10}>
                                <SelectField field={kv.$('envVar')} autoWidth={true} extraKey="environmentVariables" />
                            </Grid>
                            <Grid item xs={2}>
                            <IconButton>
                                <CloseIcon onClick={kv.onDel} />
                            </IconButton>
                            </Grid>
                        </Grid>
                        )
                    })}
                    <Button raised type="secondary" onClick={this.form.$('environmentVariables').onAdd}>
                      Add env var
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button color="primary"
                        className={styles.buttonSpacing}
                        disabled={this.state.saving}
                        type="submit"
                        raised
                        onClick={this.onSubmit.bind(this)}>
                          Save
                    </Button>

                    {this.form.values()['id'] != '' &&
                      <Button
                        disabled={this.state.saving}
                        color="accent"
                        onClick={()=>this.setState({ dialogOpen: true })}>
                        Delete
                      </Button>
                    }

                    <Button
                      color="accent"
                      onClick={this.closeDrawer.bind(this)}>
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </div>
        </Drawer>
        {extensionSpecs[this.form.values()['index']] != null &&
          <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
            <DialogTitle>{"Ae you sure you want to delete " + extensionSpecs[this.form.values()['index']].name + "?"}</DialogTitle>
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
