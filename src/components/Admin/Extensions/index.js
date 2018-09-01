import React from 'react';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
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
import Switch from 'material-ui/Switch';

import ExtensionOnceIcon from '@material-ui/icons/LooksOne';
import ExtensionWorkflowIcon from '@material-ui/icons/KeyboardTab';
import ExtensionDeploymentIcon from '@material-ui/icons/Cake';

import EnvVarIcon from '@material-ui/icons/ExplicitOutlined';
import FileIcon from '@material-ui/icons/Note';
import BuildArgIcon from '@material-ui/icons/Memory';

import ExpansionPanel, {
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  // ExpansionPanelActions,
} from 'material-ui/ExpansionPanel';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import Divider from 'material-ui/Divider';
import Card, { CardContent } from 'material-ui/Card';

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
    entries {
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
      userHasUnsavedChanges: false,
      showDrawer: false,
      showDiscardEditsConfirmDialog: false,
      extensionsMapByKey: {},
    }

    this.handleFormChanged = this.handleFormChanged.bind(this)
  }
  
  initAdminExtensionsForm(formInitials = {}) {
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
      'config[].allowOverride',
      'environmentID',
      'component',
    ];
    const rules = {
      'name': 'required|string',
      'key': 'required|string',
      'type': 'required',
      'config[].key': 'required|string',
      'config[].value': 'required|string',
      'config[].allowOverride': 'required|boolean',
      'component': 'string',
    };
    const labels = {
      'name': 'Name',
      'key': 'Key',
      'type': 'Type',
      'config': 'Config',
      'config[].key': 'Key',
      'config[].value': 'Environment Variable',
      'config[].allowOverride': 'Override',
      'component': 'React Component',
      'environmentID': 'Environment',
    };
    const initials = formInitials

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

    var handleFormChanged = this.handleFormChanged.bind(this)
    const $hooks = {
      onAdd(instance) {
        handleFormChanged()
      },
      onDel(instance) {
        handleFormChanged()
      },
      onSubmit(instance){
      },
      onSuccess(instance){
      },
      sync(instance){
      },
      onChange(instance){
        handleFormChanged()
      }
    };

    const hooks = {
      'name': $hooks,
      'key': $hooks,
      'type': $hooks,
      'config': $hooks,
      'config[]': $hooks,
      'config[].key': $hooks,
      'config[].value': $hooks,
      'config[].allowOverride': $hooks,
      'environmentID': $hooks,
      'component': $hooks,
    }

    const handlers = {};
    const plugins = { dvr: validatorjs };
    return new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { handlers , plugins })    
  }

  componentWillMount(){
    this.form = this.initAdminExtensionsForm({
      'type': 'Workflow',
      'environmentID': null,
      'config[].allowOverride': false,
    })
  }

  componentWillReceiveProps(props){
    const { data } = props;
    
    if (data && !data.loading){
      let extensionsMap = {}
      data.extensions.forEach((x)=>{
        let key = x.name
        if (!extensionsMap[key]){
          extensionsMap[key] = [x]
        } else {          
          extensionsMap[key].push(x)
        }
      })

      this.setState({extensionsMapByKey: extensionsMap})
    }
  }

  createNewExtension() {
    this.form = this.initAdminExtensionsForm({
      'type': 'Workflow',
      'environmentID': null,
      'config[].allowOverride': false,
    })
    this.setOptions()
    
    this.openDrawer()
  }

  handleFormChanged() {
    this.setState({userHasUnsavedChanges: true})
  }

  handleCancelForm() {
    if (this.state.userHasUnsavedChanges === true) {
      this.setState({showDiscardEditsConfirmDialog:true})
    } else {
      this.closeDrawer()
    }
  }

  handleClick(e, extension, index){
    this.form = this.initAdminExtensionsForm({
      id: extension.id,
      index: index,
      name: extension.name,
      key: extension.key,
      environmentID: extension.environment.id,
      component: extension.component,
      type: extension.type,
    })

    let config = extension.config.map((c) => {
      if (typeof c.allowOverride === 'undefined') {
        return {key: c.key, value: c.value, allowOverride: false};
      } else {
        return c; 
      }
    })
    
    this.form.update({ config: config })
    this.setOptions()

    this.openDrawer()
  }

  onSuccess(form){
    this.setState({ saving: true })
    if(this.form.values().id === ''){
      this.props.createExtension({
        variables: this.form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer(true)
      });
    } else {
      this.props.updateExtension({
        variables: this.form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer(true)
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
      that.closeDrawer(true)
    });
  }

  onError(){
    return
  }

  onSubmit(e){
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  mapSecretType(secret){
    switch(secret.type){
      case "file":
        return (<FileIcon className={styles.variablesIcons}/>)
      case "env":
      case "protected-env":
        return (<EnvVarIcon className={styles.variablesIcons}/>)
      case "build":
        return (<BuildArgIcon className={styles.variablesIcons}/>)
      default:
        return null
    }
    
  }

  setOptions(){
    const { secrets, environments } = this.props.data    
    // filter secrets by env of current extension if exists
    var self = this
    var envSecrets = secrets.entries
    if(this.form.$('environmentID').value){
      envSecrets = secrets.entries.filter(function(secret){
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
        icon: self.mapSecretType(secret),
        value: secret.key
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

  handleSwitchChange(e, checked) {
    this.form.$('config').map((kv, i) => {
      if(i === parseInt(e.target.value, 10)) {
        kv.set({allowOverride: checked}) 
      }
      return null
    })
  }

  getExtensionTypeGlyph(extension) {
    switch(extension.type){
      case "workflow":
        return (<ExtensionWorkflowIcon className={styles.extensionIcon}/>)
      case "deployment":
       return (<ExtensionDeploymentIcon className={styles.extensionIcon}/>)
      case "once":
        return (<ExtensionOnceIcon className={styles.extensionIcon}/>)
      default:
        return extension.type
    }
  }

  handleExpansionPanelChange = panel => (event, expanded) => {
    this.setState({
      expandedExtensionGrouping: expanded ? panel : false,
    });
  };


  renderExtensions = (extensions) => {
    return (
      <div>
      {Object.keys(extensions).map( (key, idx) => {
        return this.renderExtensionGrouping(key, extensions[key])
      })}
      </div>
    )
  }

  renderExtensionConfigDetails(extension, idx) {
    return (
      <div key={extension.key+":"+idx} className={styles.detailsItem}>
        <ExpansionPanel 
          key={extension.key+":"+idx} expanded={true} onChange={() => {}}> 
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}> 
            <Grid container spacing={24} className={styles.extensionTitle}>
              <Grid item xs={2}>
                <Typography variant="body1" style={{ fontSize: 14 }}>
                  <b> { extension.environment.name } </b> 
                </Typography>             
              </Grid>      
            </Grid>
          </ExpansionPanelSummary>

          <Divider />

          <ExpansionPanelDetails className={styles.details}>
            {"Details"}
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div>
    )
  }

  renderExtensionGrouping(key, extensionGrouping){
    return (
      <ExpansionPanel 
        key={key} expanded={this.state.expandedExtensionGrouping === key} onChange={this.handleExpansionPanelChange(key)}> 
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}> 
          <Grid container spacing={24} className={styles.extensionTitle}>
            <Grid item xs={2}>
              <Typography variant="body1" style={{ fontSize: 14 }}>
                <b> { key } </b> 
              </Typography>             
            </Grid>            
            <Grid item xs={2}>
              {this.getExtensionTypeGlyph(extensionGrouping[0])}     
            </Grid>            
            
          </Grid>>
        </ExpansionPanelSummary>

        <Divider />

        <ExpansionPanelDetails className={styles.details}>
          {extensionGrouping.map( (extension, idx) => {
            return this.renderExtensionConfigDetails(extension, idx)
          })}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }

  render() {
    const { loading } = this.props.data;
    const { extensionsMapByKey } = this.state

    if(loading){
      return (
        <Loading />
      )
    }    

    return (
      <div className={styles.root}>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <Card>
              <CardContent>     
                <Typography variant="title">
                  Extensions
                </Typography>              
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {this.renderExtensions(extensionsMapByKey)}

        <Button variant="fab" aria-label="Add" type="submit" color="primary"
              style={inlineStyles.addButton}
              onClick={() => {this.createNewExtension()}}>
              <AddIcon />
        </Button>

        <Drawer
          anchor="right"
          classes={{
            paper: styles.drawer
          }}
          onClose={() => {this.handleCancelForm()}}          
          open={this.state.showDrawer}
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
                    {this.form.$('config').map((kv, i) => {
                        return (
                        <Grid container spacing={24} key={kv.id}>
                            <Grid item xs={5}>
                                <InputField field={kv.$('key')} fullWidth={true} />
                            </Grid>
                            <Grid item xs={4}>
                                <EnvVarSelectField field={kv.$('value')} fullWidth={true} extraKey="config" />
                            </Grid>
                            <Grid item xs={1}>
                                <Switch checked={kv.$('allowOverride').value} value={i.toString()} onChange={this.handleSwitchChange.bind(this)}/>
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
                      onClick={() => {this.handleCancelForm()}}>
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </div>
        </Drawer>

        {/* Used for confirmation of escaping panel if dirty form */}
        <Dialog open={this.state.showDiscardEditsConfirmDialog}>
          <DialogTitle>{"Are you sure you want to escape?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {"You'll lose any progress made so far."}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> this.setState({ showDiscardEditsConfirmDialog: false })} color="primary">
              Cancel
            </Button>
            <Button onClick={() => {this.closeDrawer(true)}} style={{ color: "red" }}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

       

      </div>
    );
  }
}