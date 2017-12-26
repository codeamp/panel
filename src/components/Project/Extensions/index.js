import React from 'react';
import { observer, inject } from 'mobx-react';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import { CircularProgress } from 'material-ui/Progress';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import ExtensionStateCompleteIcon from 'material-ui-icons/CheckCircle';
import EnvVarSelectField from 'components/Form/envvar-select-field';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import styles from './style.module.css';
import DockerBuilder from './DockerBuilder';

@inject("store") @observer
@graphql(gql`
  query ProjectExtensions($slug: String, $environmentId: String){
    project(slug: $slug, environmentId: $environmentId) {
      id
      name
      slug
      extensions {
        id
        extensionSpec {
          id
          name
          type
        }
        state
        config
        artifacts {
          key
          value
        }
        created
      }
      environmentVariables {
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
    extensionSpecs {
      id
      name
      component
      config
      type
      key
      created
    }
  }`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentId: props.store.app.currentEnvironment.id,
    }
  })
})

@graphql(gql`
  mutation CreateExtension ($projectId: String!, $extensionSpecId: String!, $config: Json!, $environmentId: String!) {
      createExtension(extension:{
        projectId: $projectId,
        extensionSpecId: $extensionSpecId,
        config: $config,
        environmentId: $environmentId,
      }) {
          id
      }
  }`, { name: "createExtension" }
)

@graphql(gql`
  mutation UpdateExtension ($id: String, $projectId: String!, $extensionSpecId: String!, $config: Json!, $environmentId: String!) {
      updateExtension(extension:{
        id: $id,
        projectId: $projectId,
        extensionSpecId: $extensionSpecId,
        config: $config,
        environmentId: $environmentId,
      }) {
          id
      }
  }`, { name: "updateExtension" }
)

@graphql(gql`
  mutation DeleteExtension ($id: String, $projectId: String!, $extensionSpecId: String!, $config: Json!, $environmentId: String!) {
      deleteExtension(extension:{
        id: $id,
        projectId: $projectId,
        extensionSpecId: $extensionSpecId,
        config: $config,
        environmentId: $environmentId,
      }) {
          id
      }
  }`, { name: "deleteExtension" }
)
export default class Extensions extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      addedExtensionsDrawer: {
        open: false,
        currentExtension: null,
      },
      availableExtensionsDrawer: {
        open: false,
        currentExtensionSpec: null,
        btnDisabled: false,
      },
      dialogOpen: false,
      customComponentExists: false,
    }
  }

  isAddedExtensionSelected(id){
    if(this.state.addedExtensionsDrawer.currentExtension){
      return this.state.addedExtensionsDrawer.currentExtension.id === id;
    }
    return false
  }

  isAvailableExtensionSelected(id){
    if(this.state.availableExtensionsDrawer.currentExtension){
      return this.state.availableExtensionsDrawer.currentExtensionSpec.id === id;
    }
    return false
  }

  handleAddedExtensionClick(event, extension){
    let addedExtensionsDrawer = this.state.addedExtensionsDrawer
    addedExtensionsDrawer.currentExtension = extension
    addedExtensionsDrawer.open = true

    let availableExtensionsDrawer = this.state.availableExtensionsDrawer
    availableExtensionsDrawer.open = false

    this.setState({
      addedExtensionsDrawer: addedExtensionsDrawer,
      availableExtensionsDrawer: availableExtensionsDrawer,
      currentExtension: extension
    })
  }

  handleCloseAddedExtensionsDrawer(){
    let addedExtensionsDrawer = this.state.addedExtensionsDrawer
    addedExtensionsDrawer.open = false

    this.setState({
      addedExtensionsDrawer: addedExtensionsDrawer,
      dialogOpen: false,
    })
  }

  handleAvailableExtensionClick(event, extensionSpec){
      // check if added extension includes atleast one workflow if this is type deployment
    if(extensionSpec.type === "deployment"){
        let valid = false
        this.props.data.project.extensions.forEach(function(extension){
            if(extension.extensionSpec.type === "workflow"){
                valid = true
                return
            }
        })
        if(!valid){
            this.props.store.app.setSnackbar({ msg: "Must install a workflow extension before installing a deployment type" })
            return null
        }
    }

    let availableExtensionsDrawer = this.state.availableExtensionsDrawer
    availableExtensionsDrawer.currentExtensionSpec = extensionSpec
    availableExtensionsDrawer.open = true

    let addedExtensionsDrawer = this.state.addedExtensionsDrawer
    addedExtensionsDrawer.open = false

    this.setState({
        addedExtensionsDrawer: addedExtensionsDrawer,
        autoGeneratedForm: this.renderConfig(extensionSpec),
        customComponent: this.renderCustomComponent(extensionSpec),
        availableExtensionsDrawer: availableExtensionsDrawer,
        currentExtension: extensionSpec,
    })

  }

  handleCloseAvailableExtensionsDrawer(){
    let availableExtensionsDrawer = this.state.availableExtensionsDrawer
    availableExtensionsDrawer.open = false
    availableExtensionsDrawer.btnDisabled = false

    this.setState({
      availableExtensionsDrawer: availableExtensionsDrawer,
      dialogOpen: false,
    })
  }

  onSuccessAddExtension(form){
    var self = this
    var userConfig = {
      "config": [],
      "form": {},
    }    
    Object.keys(this.form.values()).map(function(key){
      userConfig.config.push({ "key": key, "value": self.form.values()[key] })
      return null
    })

    this.props.createExtension({
      variables: {
        'projectId': this.props.data.project.id,
        'extensionSpecId': this.state.availableExtensionsDrawer.currentExtensionSpec.id,
        'config': this.state.addedExtensionsDrawer.currentExtension.config,
        'environmentId': this.props.store.app.currentEnvironment.id,
      }
    }).then(({ data }) => {
      this.props.data.refetch()
      this.handleCloseAvailableExtensionsDrawer()
    })      
  }

  onErrorAddExtension(form){
    // todo
  }

  handleAddExtension(extension, event){
    let availableExtensionsDrawer = this.state.availableExtensionsDrawer
    availableExtensionsDrawer.btnDisabled = true
    this.setState({ availableExtensionsDrawer: availableExtensionsDrawer })

    if(this.form.fields.size > 0){
      this.form.onSubmit(event, { onSuccess: this.onSuccessAddExtension.bind(this), onError: this.onErrorAddExtension.bind(this) })
    } else {
      // no form rendered by frontend
      let config = {
        "config": [],
        "form": {},
      }
      if(this.state.availableExtensionsDrawer.currentExtensionSpec.config){
        config = this.state.availableExtensionsDrawer.currentExtensionSpec.config
      }
      this.props.createExtension({
        variables: {
          'projectId': this.props.data.project.id,
          'extensionSpecId': this.state.availableExtensionsDrawer.currentExtensionSpec.id,
          'config': config,
          'environmentId': this.props.store.app.currentEnvironment.id,
        }
      }).then(({ data }) => {
        this.props.data.refetch()
        this.handleCloseAvailableExtensionsDrawer()
      });
    }
  }

  convertKVToJson(kvArr){
    let obj = {}
    kvArr.forEach(function(kv){
      obj[kv.key] = kv.value
    })
    return obj
  }

  renderCustomComponent(extensionSpec){
    switch(extensionSpec.component){
      case "DockerBuilderView":
        this.setState({ customComponentExists: true })
        return (
          <Grid spacing={24}>
            <DockerBuilder
              project={this.props.data.project}
              extensionSpec={extensionSpec}
              store={this.props.store}
              config={this.form}
              createExtension={this.props.createExtension.bind(this)}
              updateExtension={this.props.updateExtension.bind(this)}
              refetch={this.props.data.refetch}
              handleClose={this.handleCloseAvailableExtensionsDrawer.bind(this)}
              viewType="edit" />
          </Grid>)
      default:
        return (<div></div>);
    }
  }

  renderConfig(extensionSpec){
    var config = []
    if(extensionSpec.config){
      config = extensionSpec.config.config
    }

    // convert from kv -> object
    var configObj ={}
    config.map(function(kv){
      configObj[kv.key] = kv.value
      return null
    })
    var fields = Object.keys(configObj);
    const rules = {};
    const labels = {};
    const initials = Object.values(configObj);
    const types = {};
    const extra = {};
    const hooks = {};
    const handlers = {}
    const plugins = { dvr: validatorjs };
    this.form = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { handlers }, { plugins })
    
    const envVarOptions = this.props.data.project.environmentVariables.map(function(envVar){
      return {
        key: envVar.id,
        value: "(" + envVar.key + ") => " + envVar.value,
      }
    })

    this.form.state.extra({
      config: envVarOptions,
    })

    var self = this;
    return (
      <Grid spacing={24}>
        {fields.map(function(key){
          return (
            <Grid key={key} item xs={12}>
              <EnvVarSelectField field={self.form.$(key)} autoWidth={true} extraKey="config" />
            </Grid>
          )
        })}
      </Grid>
    )
  }

  renderAddedExtensionView(extension){
    let view = (<div></div>);

    if(extension.id !== -1){
        switch(extension.extensionSpec.component){
            case "DockerBuilderView":
                view = (
                  <DockerBuilder
                    project={this.props.data.project}
                    extensionSpec={extension.extensionSpec}
                    extension={extension}
                    store={this.props.store}
                    updateExtension={this.props.updateExtension}
                    handleClose={this.handleCloseAddedExtensionsDrawer.bind(this)}
                    viewType="read" />)
                break;
            default:
              view = (
              <div>
                  <Grid item xs={12}>
                    <Paper>
                      <Toolbar>
                        <div>
                          <Typography type="title">
                              Artifacts
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
                                  Value
                              </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {extension.artifacts.map(artifact => {
                          return (
                            <TableRow key={artifact.key}>
                              <TableCell>
                                {artifact.key}
                              </TableCell>
                              <TableCell>
                                {artifact.value}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        </TableBody>
                      </Table>
                    </Paper>
                  </Grid>
              </div>
              )
      }
    }
    return view
  }

  handleDeleteExtension(){
      this.props.deleteExtension({
          variables: {
            'id': this.state.addedExtensionsDrawer.currentExtension.id,
            'projectId': this.props.data.project.id,
            'extensionSpecId': this.state.addedExtensionsDrawer.currentExtension.extensionSpec.id,
            'config': this.state.addedExtensionsDrawer.currentExtension.config,
            'environmentId': this.props.store.app.currentEnvironment.id,
          }
      }).then(({ data }) => {
          this.props.data.refetch()
          this.handleCloseAddedExtensionsDrawer()
      })
  }

  render() {
    const { loading, project, extensionSpecs } = this.props.data;

    if(loading){
      return (<div>Loading...</div>);
    }

    return (
      <div>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <Paper>
              <Toolbar>
                <div>
                  <Typography type="title">
                    Added Extensions
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
                      Added
                    </TableCell>
                    <TableCell>
                      State
                    </TableCell>
                    <TableCell>
                      Type
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.extensions.map(extension => {
                    const isSelected = this.isAddedExtensionSelected(extension.id);
                    let stateIcon = <CircularProgress size={25} />
                    if(extension.state === "complete"){
                        stateIcon = <ExtensionStateCompleteIcon color={'green'} />
                    }

                    return (
                      <TableRow
                        hover
                        onClick={event => this.handleAddedExtensionClick(event, extension)}
                        selected={isSelected}
                        tabIndex={-1}
                        key={extension.id}>
                        <TableCell> { extension.extensionSpec.name } </TableCell>
                        <TableCell> { new Date(extension.created).toDateString() }</TableCell>
                        <TableCell> { stateIcon } </TableCell>
                        <TableCell> { extension.extensionSpec.type } </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper>
              <Toolbar>
                <div>
                  <Typography type="title">
                    Available Extensions
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {extensionSpecs.map(extensionSpec => {
                    let ignore = false

                    // check if this is already in added extensions
                    const addedExtensions = project.extensions.map(function(extension){
                      return extension.extensionSpec.name
                    })

                    if(addedExtensions.includes(extensionSpec.name)){
                      ignore = true
                    }

                    if(!ignore){
                      const isSelected = this.isAvailableExtensionSelected(extensionSpec.id);
                      return (
                        <TableRow
                          hover
                          onClick={event => this.handleAvailableExtensionClick(event, extensionSpec)}
                          selected={isSelected}
                          tabIndex={-1}
                          key={extensionSpec.id}>
                          <TableCell> { extensionSpec.name } </TableCell>
                          <TableCell> { extensionSpec.type } </TableCell>
                        </TableRow>
                      )
                    } else {
                      return (
                        <div></div>
                      )
                    }
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>

        {this.state.addedExtensionsDrawer.currentExtension &&
          <Drawer
            type="persistent"
            anchor="right"
            classes={{
              paper: styles.drawer
            }}
            open={this.state.addedExtensionsDrawer.open}
          >
              <div className={styles.createServiceBar}>
                <AppBar position="static" color="default">
                  <Toolbar>
                    <Typography type="title" color="inherit">
                      Extension
                    </Typography>
                  </Toolbar>
                </AppBar>
                <br/>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24}>
                    <Grid item xs={12}>
                      <Typography>
                        Type: { this.state.addedExtensionsDrawer.currentExtension.extensionSpec.type}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      {this.renderAddedExtensionView(this.state.addedExtensionsDrawer.currentExtension)}
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                        onClick={() => this.setState({ dialogOpen: true })}
                        color="accent">
                        delete
                    </Button>                  
                    <Button color="primary" onClick={this.handleCloseAddedExtensionsDrawer.bind(this)}>
                      cancel
                    </Button>
                  </Grid>            
                </div>
              </div>
          </Drawer>
        }
        {this.state.addedExtensionsDrawer.currentExtension &&
            <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
              <DialogTitle>{"Are you sure you want to delete " + this.state.addedExtensionsDrawer.currentExtension.extensionSpec.name + "?"}</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {"This will delete the extension and all its generated environment variables and cloud resources associated with" + project.name + "."}
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

      {this.state.availableExtensionsDrawer.currentExtensionSpec &&
        <Drawer
            type="persistent"
            anchor="right"
            classes={{
              paper: styles.drawer
            }}
            open={this.state.availableExtensionsDrawer.open}
          >
              <div className={styles.createServiceBar}>
                <AppBar position="static" color="default">
                  <Toolbar>
                    <Typography type="title" color="inherit">
                      Extension
                    </Typography>
                  </Toolbar>
                </AppBar>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24}>
                    <Grid item xs={12}>
                      <Typography type="subheading">
                        { this.state.availableExtensionsDrawer.currentExtensionSpec.name }
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography type="body2">
                        Type: { this.state.availableExtensionsDrawer.currentExtensionSpec.type }
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography type="subheading"><b> Config </b></Typography>
                      {this.state.autoGeneratedForm}
                    </Grid>
                    {/* User defined custom component if specified */}
                    <Grid item xs={12}>
                      <Typography type="subheading"><b> Form </b></Typography>
                      { this.state.customComponent }
                    </Grid>
                    {!this.state.customComponentExists &&
                      <Grid item xs={12}>
                        <Button raised color="primary" className={styles.rightPad}
                          onClick={(event) => this.handleAddExtension(this.state.availableExtensionsDrawer.currentExtensionSpec, event)}
                          disabled={this.state.availableExtensionsDrawer.btnDisabled}
                        >
                          Save
                        </Button>
                        <Button color="primary"
                          onClick={this.handleCloseAvailableExtensionsDrawer.bind(this)}
                        >
                          cancel
                        </Button>
                      </Grid>
                    }
                  </Grid>
                </div>
              </div>
          </Drawer>
        }
      </div>
    )
  }
}
