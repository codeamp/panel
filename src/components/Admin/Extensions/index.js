import React from 'react';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
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

import ExtensionInfraComponentIcon from '@material-ui/icons/ListAlt';
import ExtensionWorkflowIcon from '@material-ui/icons/KeyboardTab';
import ExtensionDeploymentIcon from '@material-ui/icons/Cake';
import ExtensionNotificationIcon from '@material-ui/icons/NotificationsActive';

import EnvVarIcon from '@material-ui/icons/Explicit';
import FileIcon from '@material-ui/icons/Note';
import BuildArgIcon from '@material-ui/icons/Memory';
import DeleteIcon from '@material-ui/icons/DeleteForever';

import Tooltip from 'components/Utils/Tooltip';

import ExpansionPanel, {
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  ExpansionPanelActions,
} from 'material-ui/ExpansionPanel';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Divider from 'material-ui/Divider';
import Card, { CardContent } from 'material-ui/Card';

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
      showDiscardEditsConfirmDialog: false,
      saving: false,
      showExtensionsConfigID: {},
      expandCreateExtensionPanel: {},
      extensionsMapByKey: {},
      expandedExtensionGrouping: {},
      secretValuesMap: {},
      extensionMobxForms: {},
      showConfirmDeleteExtension: false,
      pendingDeletionForm: null,
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
        value: 'Infra Component',
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

      let secretValuesMap = {}
      data.secrets.entries.forEach((x) =>{
        let key = x.id
        secretValuesMap[key] = x.key
      })

      this.setState({extensionsMapByKey: extensionsMap, secretValuesMap: secretValuesMap})
    }
  }

  createNewExtension() {
    this.form = this.initAdminExtensionsForm({
      'type': 'Workflow',
      'environmentID': null,
      'config[].allowOverride': false,
    })
    this.setOptions()
  }

  handleFormChanged() {
    this.setState({userHasUnsavedChanges: true})
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
      'config[].allowOverride': false,
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
  }

  onSuccess(form){
    this.setState({ saving: true, expandCreateExtensionPanel: false })
    if(form.values().id === ''){
      this.props.createExtension({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.setState({ saving: false })
      });
    } else {
      this.props.updateExtension({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.setState({ saving: false })        
      });
    }
  }

  queueDeleteExtension(form) {
    this.setState({ pendingDeletionForm: form, showConfirmDeleteExtension: true })
  }

  handleDeleteExtension(){
    this.setState({ saving: true })

    this.props.deleteExtension({
      variables: this.state.pendingDeletionForm.values(),
    }).then(({ data }) => {
      this.props.data.refetch()
      this.setState({pendingDeletionForm: null, showConfirmDeleteExtension: false})
    });
  }

  onError(){
    return
  }

  onSubmit(e, form){
    form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
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

  handleSwitchChange(e, form, checked) {
    form.$('config').map((kv, i) => {
      if(i === parseInt(e.target.value, 10)) {
        kv.set({allowOverride: checked}) 
      }
      return null
    })
  }

  getExtensionTypeGlyph(extension) {
    switch(extension.type){
      case "workflow":
        return (<Tooltip title="Workflow"><ExtensionWorkflowIcon className={styles.extensionIcon}/></Tooltip>)
      case "deployment":
       return (<Tooltip title="Deployment"><ExtensionDeploymentIcon className={styles.extensionIcon}/></Tooltip>)
      case "once":
        return (<Tooltip title="Infra Component"><ExtensionInfraComponentIcon className={styles.extensionIcon}/></Tooltip>)
      case "notification":
        return (<Tooltip title="Notification"><ExtensionNotificationIcon className={styles.extensionIcon}/></Tooltip>)
      default:
        return extension.type
    }
  }

  toggleCreateExtensionPanel = panel => (event, expanded) => {
    if(expanded){
      this.createNewExtension()
    }

    this.setState({
      expandCreateExtensionPanel: expanded,
    });
  };

  setFormOptions(form){
    const { secrets, environments } = this.props.data    
    // filter secrets by env of current extension if exists
    var envSecrets = secrets.entries
    if(form.$('environmentID').value){
      envSecrets = secrets.entries.filter(function(secret){
        if(form.$('environmentID').value === secret.environment.id){
          return true
        }
        return false
      })
    }

    var self=this
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

    form.state.extra({
      config: secretOptions,
      environmentID: envOptions,      
    })    

    return form
  }

  toggleExtensionConfigOpen = (panel,extension) => (event, expanded) => {
    // Is there a mobx for this one?
    let mobxForms = this.state.extensionMobxForms
    if (!(panel in mobxForms)){
      let form = this.initAdminExtensionsForm({
        id: extension.id,
        index: 0,
        name: extension.name,
        key: extension.key,
        environmentID: extension.environment.id,
        component: extension.component,
        type: extension.type,
        'config[].allowOverride': false,
      })

      let config = extension.config.map((c) => {
        if (typeof c.allowOverride === 'undefined') {
          return {key: c.key, value: c.value, allowOverride: false};
        } else {
          return c; 
        }
      })

      form.update({ config: config })
      form = this.setFormOptions(form)

      mobxForms[panel] = form
    }

    let configPanelMap = this.state.showExtensionsConfigID
    configPanelMap[panel] = expanded ? panel : null

    this.setState({
      showExtensionsConfigID: configPanelMap,
      extensionMobxForms: mobxForms,
    });
  };

  handleExpansionPanelChange = panel => (event, expanded) => {
    let expandedExtensions = this.state.expandedExtensionGrouping
    expandedExtensions[panel] = expanded ? panel : null

    this.setState({
      expandedExtensionGrouping: expandedExtensions
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

  renderMobxReactComponent(mobxForm){
    if (mobxForm){
      return (
        <Grid container spacing={16} key="simple-key">
          <Grid item xs={2}>
            <InputField field={mobxForm.$('component')} fullWidth={true} />
          </Grid>
        </Grid>
      )
    }else {
      return null
    }
  }

  renderExtensionConfigDetails(extension, idx) {
    let key=extension.key+":"+extension.environment.id + ":" + idx

    let mobxForm = this.state.extensionMobxForms[key]
    let self=this
    return (
      <div key={key} className={styles.detailsItem}>
        <ExpansionPanel 
          key={key} expanded={!!this.state.showExtensionsConfigID[key]} onChange={this.toggleExtensionConfigOpen(key, extension)}> 
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}> 
            <Grid container spacing={24} className={styles.extensionTitle}>
              <Grid item xs={6}>
                <Typography variant="body1" style={{ fontSize: 14 }}>
                  { extension.environment.name }
                </Typography>             
              </Grid>      
            </Grid>
          </ExpansionPanelSummary>

          <Divider />

          <ExpansionPanelDetails className={styles.details}>
            {this.renderMobxReactComponent(mobxForm)}
            {mobxForm && mobxForm.$('config').map((kv, i) => {
                return (
                  <Grid container spacing={40} key={kv.id}>
                      <Grid item xs={2}>
                          <InputField field={kv.$('key')} fullWidth={true} />
                      </Grid>
                      <Grid item xs={4}>
                          <EnvVarSelectField field={kv.$('value')} fullWidth={true} extraKey="config" />
                      </Grid>
                      <Grid item xs={1}>
                          <Switch checked={kv.$('allowOverride').value} value={i.toString()} onChange={(event,checked) => this.handleSwitchChange(event, mobxForm, checked)}/>
                      </Grid>
                      <Grid item xs={1}>
                        <IconButton>
                          <CloseIcon onClick={kv.onDel} />
                        </IconButton>
                      </Grid>
                  </Grid>
                )
            })}
            {mobxForm && (
              <Grid container spacing={40} className={styles.configActions} align="center">
                <Grid item xs={2}>
                  <Button color="default" variant="raised" onClick={mobxForm.$('config').onAdd}>
                    Add Config
                  </Button>
                </Grid>    
                <Grid item xs={2}>
                  <Button color="default" variant="raised" onClick={(e) => this.onSubmit(e, mobxForm)}>
                    Save
                  </Button>
                </Grid>   
              </Grid>
            )}
            
          </ExpansionPanelDetails>

          <Divider />

          <ExpansionPanelActions>
            <Button variant="raised" color="default" aria-label="Add" onClick={()=>self.queueDeleteExtension(mobxForm)} className={styles.actions}>
              <DeleteIcon/>
            </Button>
          </ExpansionPanelActions>
        </ExpansionPanel>
      </div>
    )
  }

  renderExtensionGrouping(key, extensionGrouping){
    return (
      <ExpansionPanel 
        key={key} expanded={!!this.state.expandedExtensionGrouping[key]} onChange={this.handleExpansionPanelChange(key)}> 
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}> 
          <Grid container spacing={16} className={styles.extensionTitle}>
            <Grid item xs={2}>
              <Typography variant="body1" style={{ fontSize: 14 }}>
                { key }
              </Typography>             
            </Grid>            
            <Grid item xs={2}>
              {this.getExtensionTypeGlyph(extensionGrouping[0])}     
            </Grid>                        
          </Grid>
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

  renderCreateNewExtension(){
    return (
      <ExpansionPanel 
        key={"create-new-extension"} expanded={this.state.expandCreateExtensionPanel === true} onChange={this.toggleCreateExtensionPanel()}
        className={styles.createNewExtensionPanel}> 
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}> 
          <Grid container spacing={16} className={styles.extensionTitle}>
            <Grid item xs={2}>
              <Typography variant="body1" style={{ fontSize: 14 }}>
                <b> { "Add Extension" } </b> 
              </Typography>             
            </Grid>            
          </Grid>
        </ExpansionPanelSummary>

        <Divider />

        <ExpansionPanelDetails className={styles.createNewExtension}>
          <div className={styles.createServiceBar}>
            <form onSubmit={(e) => e.preventDefault()}>
              <Grid container spacing={24} className={styles.grid}>
                <Grid item xs={4}>
                  <InputField field={this.form.$('name')} fullWidth={true} />
                </Grid>
                <Grid item xs={4}>
                  <InputField field={this.form.$('key')} fullWidth={true} />
                </Grid>
                <Grid item xs={4}>
                  <SelectField field={this.form.$('environmentID')} fullWidth={true} extraKey='environmentID'/>
                </Grid>
                <Grid item xs={4}>
                  <SelectField field={this.form.$('type')} fullWidth={true} />
                </Grid>
                <Grid item xs={4}>
                  <InputField field={this.form.$('component')} fullWidth={true} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="title">
                    Config
                  </Typography>
                  <Divider />
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
                              <Switch checked={kv.$('allowOverride').value} value={i.toString()} onChange={(event, checked) => this.handleSwitchChange(event, this.form, checked)}/>
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
                      onClick={(e) => this.onSubmit(e, this.form)}>
                        Add Extension
                  </Button>

                  {this.form.values()['id'] !== '' &&
                    <Button
                      disabled={this.state.saving}
                      style={{ color: "red" }}
                      onClick={()=>this.setState({ dialogOpen: true })}>
                      Delete
                    </Button>
                  }
                </Grid>
              </Grid>
            </form>
          </div>
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
        {this.renderCreateNewExtension()}
        {this.renderExtensions(extensionsMapByKey)}

        {/* Used for confirmation of deleting extension panel */}
        <Dialog open={this.state.showConfirmDeleteExtension}>
          <DialogTitle>{"Are you sure you want to delete?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {"This extension will be gone forever."}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> this.setState({ showConfirmDeleteExtension: false, pendingDeletionForm: null })} color="primary">
              Cancel
            </Button>
            <Button onClick={() => {this.handleDeleteExtension()}} style={{ color: "red" }}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}