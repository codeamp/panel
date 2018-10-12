import React from 'react';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import AppBar from 'material-ui/AppBar';
import AddIcon from '@material-ui/icons/Add';
import Drawer from 'material-ui/Drawer';
import IconButton from 'material-ui/IconButton';
import Paper from 'material-ui/Paper';
import Toolbar from 'material-ui/Toolbar';
import CloseIcon from '@material-ui/icons/Close';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { MenuItem, MenuList } from 'material-ui/Menu';
import Input from 'material-ui/Input';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import ExpansionPanel, {
  ExpansionPanelSummary, ExpansionPanelDetails
} from 'material-ui/ExpansionPanel';
import Divider from 'material-ui/Divider';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import SelectField from 'components/Form/select-field';
import InputField from 'components/Form/input-field';
import RadioField from 'components/Form/radio-field';
import Loading from 'components/Utils/Loading';
import { observer, inject } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import styles from './style.module.css';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Manager, Target, Popper } from 'react-popper';
import ClickAwayListener from 'material-ui/utils/ClickAwayListener';
import Grow from 'material-ui/transitions/Grow';
import jstz from 'jstimezonedetect';
import moment from 'moment';
import 'moment-timezone';
import Tooltip from 'components/Utils/Tooltip';

import OneShotIcon from '@material-ui/icons/LooksOne';
import GeneralIcon from '@material-ui/icons/Autorenew';

@inject("store") 
@graphql(gql`
query Project($slug: String, $environmentID: String) {
  project(slug: $slug, environmentID: $environmentID) {
    id
    services{
      entries {
        id
        name
        command
        serviceSpec {
          id
          name
        }
        count
        type
        ports
        created
        deploymentStrategy
        readinessProbe
        livenessProbe
        preStopHook
      }
    }
  }
  serviceSpecs {
    id
    name
    cpuRequest
    cpuLimit
    memoryRequest
    memoryLimit
    terminationGracePeriod
  }
}`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.store.app.currentEnvironment.id,
    }
  })
})

// Mutations
@graphql(gql`
mutation CreateService($projectID: String!, $command: String!, $name: String!, $serviceSpecID: String!,
    $count: Int!, $type: String!, $ports: [ServicePortInput!], $environmentID: String!,
    $deploymentStrategy: DeploymentStrategyInput!, $readinessProbe: HealthProbeInput, $livenessProbe: HealthProbeInput,
    $preStopHook: String) {
    createService(service:{
    projectID: $projectID,
    command: $command,
    name: $name,
    serviceSpecID: $serviceSpecID,
    count: $count,
    type: $type,
    ports: $ports,
    environmentID: $environmentID,
    deploymentStrategy: $deploymentStrategy,
    readinessProbe: $readinessProbe,
    livenessProbe: $livenessProbe,
    preStopHook: $preStopHook
    }) {
      id
    }
}`, { name: "createService" })

@graphql(gql`
mutation UpdateService($id: String, $projectID: String!, $command: String!, $name: String!, $serviceSpecID: String!,
    $count: Int!, $type: String!, $ports: [ServicePortInput!], $environmentID: String!,
    $deploymentStrategy: DeploymentStrategyInput!, $readinessProbe: HealthProbeInput, $livenessProbe: HealthProbeInput,
    $preStopHook: String) {
    updateService(service:{
    id: $id,
    projectID: $projectID,
    command: $command,
    name: $name,
    serviceSpecID: $serviceSpecID,
    count: $count,
    type: $type,
    ports: $ports,
    environmentID: $environmentID,
    deploymentStrategy: $deploymentStrategy,
    readinessProbe: $readinessProbe,
    livenessProbe: $livenessProbe,
    preStopHook: $preStopHook
    }) {
      id
    }
}`, { name: "updateService" })

@graphql(gql`
mutation DeleteService ($id: String, $projectID: String!, $command: String!, $name: String!, $serviceSpecID: String!,
  $count: Int!, $type: String!, $ports: [ServicePortInput!], $environmentID: String!,
  $deploymentStrategy: DeploymentStrategyInput!, $readinessProbe: HealthProbeInput, $livenessProbe: HealthProbeInput,
  $preStopHook: String) {
  deleteService(service:{
  id: $id,
  projectID: $projectID,
  command: $command,
  name: $name,
  serviceSpecID: $serviceSpecID,
  count: $count,
  type: $type,
  ports: $ports,
  environmentID: $environmentID,
  deploymentStrategy: $deploymentStrategy,
  readinessProbe: $readinessProbe,
  livenessProbe: $livenessProbe,
  preStopHook: $preStopHook
  }) {
    id
  }
}`, { name: "deleteService" })

@observer
export default class Services extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      drawerOpen: false,
      anchorEl: null,
      userHasUnsavedChanges: false,
      saving: false,

      showConfirmDeleteDialog: false,      
      showAddServiceMenu: false,
      showDiscardEditsConfirmDialog: false,
      showAdvancedSettings: false,
      showDeploymentStrategySettings: false,
      showReadinessProbeSettings: false,
      showLivenessProbeSettings: false,
      showLifecycleSettings: false
    }

    this.handleDeleteService = this.handleDeleteService.bind(this)
    this.handleCancelForm = this.handleCancelForm.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  handleToggleDrawer(){
    this.setState({ open: !this.state.open })
  }

  handleFormChanged() {
    this.setState({userHasUnsavedChanges: true})
  }

  handleServiceMenuClickAway() {
    if (this.state.showAddServiceMenu === true) {
      this.setState({showAddServiceMenu:false})
    } 
  }

  handleDrawerClickAway() {
    if (this.state.drawerOpen === true) {
      this.handleCancelForm()
    } 
  }

  handleCancelForm() {
    if (this.state.userHasUnsavedChanges === true) {
      this.setState({showDiscardEditsConfirmDialog:true})
    } else {
      this.closeDrawer()
    }
  }

  handleToggleAdvancedSettings = panel => (event) => {
    this.setState({ showAdvancedSettings: !this.state.showAdvancedSettings });
  };

  handleToggleDeploymentStrategySettings = panel => (event) => {
    this.setState(({showDeploymentStrategySettings: !this.state.showDeploymentStrategySettings}))
  }

  handleToggleLivenessProbeSettings = panel => (event) => {
    this.setState(({showLivenessProbeSettings: !this.state.showLivenessProbeSettings}))
  }

  handleToggleReadinessProbeSettings = panel => (event) => {
    this.setState(({showReadinessProbeSettings: !this.state.showReadinessProbeSettings}))
  }

  handleToggleLifecycleSettings = panel => (event) => {
    this.setState(({showLifecycleSettings: !this.state.showLifecycleSettings}))
  }

  initProjectServicesForm(formInitials  = {}) {
    const fields = [
      'id',
      'name',
      'serviceSpecID',
      'count',
      'command',
      'type',
      'projectID',
      'ports',
      'ports[]',
      'ports[].port',
      'ports[].protocol',
      'environmentID',
      'index',
      'deploymentStrategy',
      'deploymentStrategy.type',
      'deploymentStrategy.maxUnavailable',
      'deploymentStrategy.maxSurge',

      // livenessProbe form inputs
      'livenessProbe',
      'livenessProbe.method',
      'livenessProbe.command',
      'livenessProbe.port',
      'livenessProbe.scheme',
      'livenessProbe.path',
      'livenessProbe.initialDelaySeconds',
      'livenessProbe.periodSeconds',
      'livenessProbe.timeoutSeconds',
      'livenessProbe.successThreshold',
      'livenessProbe.failureThreshold',
      'livenessProbe.httpHeaders',
      'livenessProbe.httpHeaders[]',
      'livenessProbe.httpHeaders[].name',
      'livenessProbe.httpHeaders[].value',

      // readinessProbe form inputs
      'readinessProbe',
      'readinessProbe.method',
      'readinessProbe.command',
      'readinessProbe.port',
      'readinessProbe.scheme',
      'readinessProbe.path',
      'readinessProbe.initialDelaySeconds',
      'readinessProbe.periodSeconds',
      'readinessProbe.timeoutSeconds',
      'readinessProbe.successThreshold',
      'readinessProbe.failureThreshold',
      'readinessProbe.httpHeaders',
      'readinessProbe.httpHeaders[]',
      'readinessProbe.httpHeaders[].name',
      'readinessProbe.httpHeaders[].value',

      'preStopHook'
    ];

    const rules = {
      'name': 'string|required|min:1|max:63',
      'serviceSpecID': 'string|required',
      'command': 'string',
      'count': 'numeric|required|min:0',
      'ports[].port': 'numeric|required|between:1,65535',
      'ports[].protocol': 'required',
      'deploymentStrategy.maxUnavailable': "numeric|between:0,100",
      'deploymentStrategy.maxSurge': "numeric|between:0,100",

      'livenessProbe.method': "string",
      'livenessProbe.command': "string",
      'livenessProbe.port': 'numeric|between:0,65535',
      'livenessProbe.scheme': "string",
      'livenessProbe.path': "string",
      'livenessProbe.initialDelaySeconds': "numeric|min:0",
      'livenessProbe.periodSeconds': "numeric|min:0",
      'livenessProbe.timeoutSeconds': "numeric|min:0",
      'livenessProbe.successThreshold': "numeric|min:0",
      'livenessProbe.failureThreshold': "numeric|min:0",
      'livenessProbe.httpHeaders[].name': "string|required",
      'livenessProbe.httpHeaders[].value': "string|required",

      'readinessProbe.method': "string",
      'readinessProbe.command': "string",
      'readinessProbe.port': 'numeric|between:0,65535',
      'readinessProbe.scheme': "string",
      'readinessProbe.path': "string",
      'readinessProbe.initialDelaySeconds': "numeric|min:0",
      'readinessProbe.periodSeconds': "numeric|min:0",
      'readinessProbe.timeoutSeconds': "numeric|min:0",
      'readinessProbe.successThreshold': "numeric|min:0",
      'readinessProbe.failureThreshold': "numeric|min:0",
      'readinessProbe.httpHeaders[].name': "string|required",
      'readinessProbe.httpHeaders[].value': "string|required",

      'preStopHook': "string"
    };

    const labels = {
      'name': 'Name',
      'serviceSpecID': 'Service Spec',
      'count': 'Count',
      'command': 'Command',
      'ports': 'Container Ports',
      'ports[].port': 'Port',
      'ports[].protocol': 'Protocol',
      'deploymentStrategy': 'Custom Deployment Strategy',
      'deploymentStrategy.type': 'Type',
      'deploymentStrategy.maxUnavailable': 'MaxUnavailable %',
      'deploymentStrategy.maxSurge': 'MaxSurge %',

      'livenessProbe.method': "Method",
      'livenessProbe.command': "Command",
      'livenessProbe.port': "Port",
      'livenessProbe.scheme': "Scheme",
      'livenessProbe.path': "Path",
      'livenessProbe.initialDelaySeconds': "InitialDelaySeconds",
      'livenessProbe.periodSeconds': "PeriodSeconds",
      'livenessProbe.timeoutSeconds': "TimeoutSeconds",
      'livenessProbe.successThreshold': "SuccessThreshold",
      'livenessProbe.failureThreshold': "FailureThreshold",
      'livenessProbe.httpHeaders[]': "HTTPHeaders",
      'livenessProbe.httpHeaders[].name': "Name",
      'livenessProbe.httpHeaders[].value': "Value",

      'readinessProbe.method': "Method",
      'readinessProbe.command': "Command",
      'readinessProbe.port': "Port",
      'readinessProbe.scheme': "Scheme",
      'readinessProbe.path': "Path",
      'readinessProbe.initialDelaySeconds': "InitialDelaySeconds",
      'readinessProbe.periodSeconds': "PeriodSeconds",
      'readinessProbe.timeoutSeconds': "TimeoutSeconds",
      'readinessProbe.successThreshold': "SuccessThreshold",
      'readinessProbe.failureThreshold': "FailureThreshold",
      'readinessProbe.httpHeaders[]': "HTTPHeaders",
      'readinessProbe.httpHeaders[].name': "Name",
      'readinessProbe.httpHeaders[].value': "Value",

      'preStopHook': "Command"
    };

    const initials = formInitials

    const types = {
      'count': 'number',
      'ports[].port': 'number',
      'deploymentStrategy.maxUnavailable': 'number',
      'deploymentStrategy.maxSurge': 'number',

      'livenessProbe.port': 'number',
      'livenessProbe.initialDelaySeconds': 'number',
      'livenessProbe.periodSeconds': 'number',
      'livenessProbe.timeoutSeconds': 'number',
      'livenessProbe.successThreshold': 'number',
      'livenessProbe.failureThreshold': 'number',

      'readinessProbe.port': 'number',
      'readinessProbe.initialDelaySeconds': 'number',
      'readinessProbe.periodSeconds': 'number',
      'readinessProbe.timeoutSeconds': 'number',
      'readinessProbe.successThreshold': 'number',
      'readinessProbe.failureThreshold': 'number',
    };

    const keys = {};

    const extra = {
      'ports[].protocol': ['TCP', 'UDP'],
      'deploymentStrategy.type': [
        {'key': 'default', 'value': 'Default (RollingUpdate, 30%,60%)'},
        {'key': 'recreate', 'value': 'Recreate'},
        {'key': 'rollingUpdate', 'value': 'RollingUpdate'}
      ],
      'readinessProbe.method': [
        {'key': 'default', 'value': 'Default'},
        {'key': 'exec', 'value': 'Exec'},
        {'key': 'http', 'value': 'HTTP'},
        {'key': 'tcp', 'value': 'TCP'}
      ],
      'readinessProbe.scheme': [
        {'key': 'http', 'value': 'HTTP'},
        {'key': 'https', 'value': 'HTTPS'}
      ],
      'livenessProbe.method': [
        {'key': 'default', 'value': 'Default'},
        {'key': 'exec', 'value': 'Exec'},
        {'key': 'http', 'value': 'HTTP'},
        {'key': 'tcp', 'value': 'TCP'}
      ],
      'livenessProbe.scheme': [
        {'key': 'http', 'value': 'HTTP'},
        {'key': 'https', 'value': 'HTTPS'}
      ],
      };

    var handleFormChanged = this.handleFormChanged.bind(this)
    const $hooks = {
      onAdd(instance) {
        // console.log('-> onAdd HOOK', instance.path || 'form');
        handleFormChanged()
      },
      onDel(instance) {
        // console.log('-> onDel HOOK', instance.path || 'form');
        handleFormChanged()
      },
      onSubmit(instance){
        // console.log('-> onSubmit HOOK', instance.path || 'form');
      },
      onSuccess(instance){
        // console.log('Form Values!', instance.values())
      },
      sync(instance){
        // console.log('sync', instance)
      },
      onChange(instance){
        // console.log(instance.values())
        handleFormChanged()
      }
    };

    const hooks = {
      'name': $hooks,
      'count': $hooks,
      'command': $hooks,
      'ports': $hooks,
      'serviceSpecID': $hooks,
      'ports[]': $hooks,
      'deploymentStrategy': $hooks,
      'readinessProbe': $hooks,
      
      'livenessProbe.method': $hooks,
      'livenessProbe.command': $hooks,
      'livenessProbe.port': $hooks,
      'livenessProbe.scheme': $hooks,
      'livenessProbe.path': $hooks,
      'livenessProbe.initialDelaySeconds': $hooks,
      'livenessProbe.periodSeconds': $hooks,
      'livenessProbe.timeoutSeconds': $hooks,
      'livenessProbe.successThreshold': $hooks,
      'livenessProbe.failureThreshold': $hooks,

      'readinessProbe.method': $hooks,
      'readinessProbe.command': $hooks,
      'readinessProbe.port': $hooks,
      'readinessProbe.scheme': $hooks,
      'readinessProbe.path': $hooks,
      'readinessProbe.initialDelaySeconds': $hooks,
      'readinessProbe.periodSeconds': $hooks,
      'readinessProbe.timeoutSeconds': $hooks,
      'readinessProbe.successThreshold': $hooks,
      'readinessProbe.failureThreshold': $hooks,
      
      'preStopHook': $hooks
    };

    const plugins = { dvr: validatorjs };

    const options = {
      autoParseNumbers: true
    }

    return new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types, keys }, { plugins, options });    
  }

  componentWillMount(){
    this.form = this.initProjectServicesForm()
  }

  onSuccess(form) {
    if(form.values()['id'] !== ""){
      this.props.updateService({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer(true)
      })
    } else {
      this.props.createService({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer(true)
      });
    }
  }

  onError(form) {
    this.setState({ saving: false })
  }

  handleClick = event => {
    this.setState({ showAddServiceMenu: true, anchorEl: event.currentTarget });
  };

  handleServiceRequest = value => {
    this.form.$('type').set(value);
    this.form = this.initProjectServicesForm({
      'type': value,
      'environmentID': this.props.store.app.currentEnvironment.id,
      'deploymentStrategy.type': 'default',
      'readinessProbe.method': 'default',
      'livenessProbe.method': 'default'
    })    

    this.openDrawer()
  };

  openDrawer(){
    this.setState({ drawerOpen: true, showAddServiceMenu: false })
  }

  closeDrawer(force = false){
    if(force || this.state.userHasUnsavedChanges === false){
      this.setState({
          drawerOpen: false,
          showAddServiceMenu: false,
          saving: false,
          showDiscardEditsConfirmDialog: false,
          showConfirmDeleteDialog: false,
          userHasUnsavedChanges: false,
          showAdvancedSettings: false,
        })
    } 
  }

  editService(service, index){
    this.form = this.initProjectServicesForm({
      name: service.name,
      count: service.count,
      command: service.command,
      serviceSpecID: service.serviceSpec.id,
      type: service.type,
      id: service.id,
      index: index,
      environmentID: this.props.store.app.currentEnvironment.id,
      preStopHook: service.preStopHook
    })
    this.form.$('name').set('disabled', true)
    this.form.update({ ports: service.ports })

    let newState = {}

    if (service.deploymentStrategy.type === "" || service.deploymentStrategy.type === "default" ) {
      this.form.update({ deploymentStrategy: {type: "default"} })
    } else {
      this.form.update({ deploymentStrategy: service.deploymentStrategy })
      newState.showAdvancedSettings = true
      newState.showDeploymentStrategySettings = true
    }

    if (service.readinessProbe.method === "") {
      this.form.update({readinessProbe: {method: "default"}})
    } else {
      this.form.update({readinessProbe: service.readinessProbe})
      newState.showAdvancedSettings = true
      newState.showReadinessProbeSettings = true
    }

    if (service.livenessProbe.method === "") {
      this.form.update({livenessProbe: {method: "default"}})
    } else {
      this.form.update({livenessProbe: service.livenessProbe})
      newState.showAdvancedSettings = true
      newState.showLivenessProbeSettings = true
    }

    if (service.preStopHook !== "") {
      newState.showAdvancedSettings = true
      newState.showLifecycleSettings = true
    }

    this.setState(newState)

    this.openDrawer()
  }

  onSubmit(e) {
    this.setState({ saving: true})
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  handleDeleteService() {
    this.setState({ showConfirmDeleteDialog: false, loading: true })
    this.props.deleteService({
      variables: this.form.values(),
    }).then(({data}) => {
      this.props.data.refetch()
      this.closeDrawer(true)
    });
  }

  getServiceTypeGlyph(service){
    switch(service.type){
      case "one-shot":
        return <Tooltip title="One-Shot"><OneShotIcon/></Tooltip>
      case "general":
        return <Tooltip title="General"><GeneralIcon/></Tooltip>
      default:
        return service.type
    }
  }

  render() {
    const { loading, project, serviceSpecs } = this.props.data;
    if(loading){
      return (
        <Loading />
      )
    }

    this.form.$('projectID').set(project.id)
    this.form.state.extra({
      serviceSpecs: serviceSpecs.map(function(serviceSpec){
        return {
          key: serviceSpec.id,
          value: serviceSpec.name,
          tooltip: "Req: " + serviceSpec.cpuRequest + "mcpu | Lim: " + 
                     serviceSpec.cpuLimit + "mcpu | Req: " + serviceSpec.memoryRequest + "mb | Lim: " + 
                     serviceSpec.memoryLimit + "mb | T/o: " + serviceSpec.terminationGracePeriod + "s",
        }
      })
    })
    return (
      <div>
          <Paper className={styles.tablePaper}>
            <Toolbar>
              <div>
                <Typography variant="title">
                  Services
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
                    Count
                  </TableCell>
                  <TableCell>
                    Command
                  </TableCell>
                  <TableCell>
                    Type
                  </TableCell>
                  <TableCell>
                    Open Ports
                  </TableCell>
                  <TableCell>
                    Service Spec
                  </TableCell>
                  <TableCell>
                    Created
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {project.services.entries.map( (service, index) => {
                  return (
                    <TableRow
                      hover
                      onClick={event => this.editService(service, index)}
                      tabIndex={-1}
                      key={service.id}>
                      <TableCell> { service.name } </TableCell>
                      <TableCell> { service.count } </TableCell>
                      <TableCell> <Input value={ service.command } disabled fullWidth={true} /></TableCell>
                      <TableCell> { this.getServiceTypeGlyph(service) }</TableCell>
                      <TableCell> { service.ports.length}</TableCell>
                      <TableCell> { service.serviceSpec.name}</TableCell>
                      <TableCell> { moment(new Date(service.created)).format("ddd, MMM Do, YYYY HH:mm:ss") + " (" + moment.tz(jstz.determine().name()).format('z') + ")" }</TableCell>
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
                aria-owns={this.state.showAddServiceMenu ? 'menu-list' : null}
                aria-haspopup="true"
                onClick={this.handleClick}>
                <AddIcon />
              </Button>
            </Target>
            <Popper
              placement="bottom-start"
              eventsEnabled={this.state.showAddServiceMenu}
            >
              <ClickAwayListener onClickAway={()=>this.handleServiceMenuClickAway()}>
                <Grow in={this.state.showAddServiceMenu} id="menu-list">
                  <Paper>
                    <MenuList role="menu">
                      <MenuItem onClick={() => this.handleServiceRequest("one-shot")}><OneShotIcon/>One-shot service</MenuItem>
                      <MenuItem onClick={() => this.handleServiceRequest("general")}><GeneralIcon/>General</MenuItem>
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
            onClose={() => {this.handleDrawerClickAway()}}
            open={this.state.drawerOpen}
        >
            <div tabIndex={0} className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                  <Toolbar>
                  <Typography variant="title" color="inherit">
                      Service
                  </Typography>
                  </Toolbar>
              </AppBar>
              <form onSubmit={this.form.onSubmit}>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24} className={styles.grid}>
                    <Grid item xs={12}>
                      <InputField field={this.form.$('name')} fullWidth={true} disabled={this.form.$('name').disabled} />
                    </Grid>
                    <Grid item xs={12}>
                      <InputField field={this.form.$('command')} fullWidth={true}/>
                    </Grid>
                    <Grid item xs={3}>
                      <InputField field={this.form.$('count')} fullWidth={true}/>
                    </Grid>
                    <Grid item xs={9}>
                      <SelectField field={this.form.$('serviceSpecID')} extraKey={"serviceSpecs"} fullWidth={true}/>
                    </Grid>
                    <Grid item xs={12}>
                        <div>
                          <Grid container spacing={24}>
                              { this.form.$('ports').value.length > 0 &&
                                <Grid item xs={12}>
                                  <Typography variant="subheading"> Container Ports </Typography>
                                </Grid>
                              }
                              { this.form.$('ports').value.length > 0 &&
                                <Grid item xs={12}>
                                  <div>
                                      {this.form.$('ports').map(port =>
                                        <Grid key={port.id} container spacing={24}>
                                          <Grid item xs={4}>
                                            <InputField field={port.$('port')} fullWidth={false} className={styles.portFormInput} />
                                          </Grid>
                                          <Grid item xs={6}>
                                            <RadioField field={port.$('protocol')} />
                                          </Grid>
                                          <Grid item xs={1}>
                                            <IconButton>
                                              <CloseIcon onClick={port.onDel} />
                                            </IconButton>
                                          </Grid>
                                        </Grid>
                                      )}
                                  </div>
                                </Grid>
                              }
                              <Grid item xs={12}>
                                <Button variant="raised" type="secondary" onClick={this.form.$('ports').onAdd}>
                                    Add container port
                                </Button>
                              </Grid>
                          </Grid>
                        </div>

                        <ExpansionPanel className={styles.advancedSettingsContainer} expanded={this.state.showAdvancedSettings} onChange={this.handleToggleAdvancedSettings()}>

                          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                            <Typography>
                              Advanced Configurations
                            </Typography>
                          </ExpansionPanelSummary>

                          <ExpansionPanelDetails>
                            <Grid container spacing={8} direction={'row'}>
                              <Grid item xs={12}>
                                <ExpansionPanel className={styles.advancedSettingsExpansionPanel} expanded={this.state.showDeploymentStrategySettings} onChange={this.handleToggleDeploymentStrategySettings()}>
                                  <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                    <Typography>
                                        Deployment Strategy
                                    </Typography>
                                  </ExpansionPanelSummary>
                                  <Divider/>
                                  <ExpansionPanelDetails>
                                    <Grid item xs={12} className={styles.settingsPanelOpen} key={this.form.$('deploymentStrategy').id}>
                                      <Grid item xs={12}>
                                        <SelectField field={this.form.$('deploymentStrategy.type')} fullWidth={false} />
                                      </Grid>
                                      { this.form.$('deploymentStrategy.type').value === "rollingUpdate" &&
                                        <Grid container spacing={24}>
                                          <Grid item xs={6}>
                                            <InputField field={this.form.$('deploymentStrategy.maxUnavailable')} fullWith={false} />
                                          </Grid>
                                          <Grid item xs={6}>
                                            <InputField field={this.form.$('deploymentStrategy.maxSurge')} fullWith={false} />
                                          </Grid>
                                        </Grid>
                                      }
                                    </Grid>
                                  </ExpansionPanelDetails>
                                </ExpansionPanel>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <ExpansionPanel expanded={this.state.showReadinessProbeSettings} onChange={this.handleToggleReadinessProbeSettings()}>
                                  <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                    <Typography>
                                      Readiness Probe
                                    </Typography>
                                  </ExpansionPanelSummary>
                                  <Divider/>
                                  <ExpansionPanelDetails>
                                  <Grid item xs={12}>
                                    <Grid key={this.form.$('readinessProbe').id} container direction={'column'} className={styles.healthProbe}>
                                      <Grid item xs={12}>
                                        <Grid container direction={'row'}>
                                          <Grid item xs={6}>
                                            <SelectField field={this.form.$('readinessProbe.method')} fullWidth={true} />
                                          </Grid>
                                        </Grid>
                                      </Grid>

                                        {this.form.$('readinessProbe.method').value !== 'default' && (
                                          <Grid item xs={12}>
                                          { this.form.$('readinessProbe.method').value === 'exec' && (
                                            <Grid item xs={12}>
                                              <InputField field={this.form.$('readinessProbe.command')} fullWidth={true} />
                                            </Grid>
                                          )}

                                          { this.form.$('readinessProbe.method').value === 'http' && (
                                            <Grid container direction={'row'} spacing={8} justify={'flex-start'}>
                                              <Grid item xs={4}>
                                                <SelectField field={this.form.$('readinessProbe.scheme')} fullWidth={true} />
                                              </Grid>
                                              <Grid item xs={2}>
                                                <InputField field={this.form.$('readinessProbe.port')} fullWidth={true} />
                                              </Grid>
                                              <Grid item xs={12}>
                                                <InputField field={this.form.$('readinessProbe.path')} fullWidth={true} />
                                              </Grid>
                                                <Grid item xs={12}>
                                                  {this.form.$('readinessProbe.httpHeaders').value.length > 0 && (
                                                    <Grid item xs={12}>
                                                      {this.form.$('readinessProbe.httpHeaders').map(header =>
                                                      <Grid container spacing={8} key={header.id}>
                                                          <Grid item xs={6}>
                                                            <InputField field={header.$('name')}/>
                                                          </Grid>
                                                          <Grid item xs={5}>
                                                            <InputField field={header.$('value')}/>
                                                          </Grid>
                                                        <Grid item xs={1}>
                                                          <IconButton>
                                                            <CloseIcon onClick={header.onDel} />
                                                          </IconButton>
                                                        </Grid>
                                                      </Grid>
                                                      )}
                                                    </Grid>
                                                  )}
                                                  <Grid item xs={12} className={styles.addHeaderButton}>
                                                    <Button variant="raised" type="secondary" onClick={this.form.$('readinessProbe.httpHeaders').onAdd}>
                                                        Add Header
                                                    </Button>
                                                  </Grid>
                                                </Grid>
                                            </Grid>
                                          )}
                                          { this.form.$('readinessProbe.method').value === 'tcp' && (
                                            <Grid container justify={'flex-start'}>
                                              <Grid item xs={4}>
                                                <InputField field={this.form.$('readinessProbe.port')} fullWidth={true} />
                                              </Grid>
                                            </Grid>
                                          )}
                                          { this.form.$('readinessProbe.method').value !== "" && (
                                            <Grid container spacing={8} direction={'column'}>
                                              <Grid container spacing={40} direction={'row'} justify={'flex-start'}>
                                                <Grid item xs={6}>
                                                  <InputField field={this.form.$('readinessProbe.successThreshold')} fullWidth={true}/>
                                                </Grid>
                                                <Grid item xs={6}>
                                                  <InputField field={this.form.$('readinessProbe.failureThreshold')} fullWidth={true} />
                                                </Grid>
                                              </Grid>
                                              <Grid container spacing={40} direction={'row'} justify={'space-around'}>
                                                <Grid item xs={3}>
                                                  <InputField field={this.form.$('readinessProbe.initialDelaySeconds')} fullWidth={true}/>
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={this.form.$('readinessProbe.periodSeconds')} fullWidth={true} />
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={this.form.$('readinessProbe.timeoutSeconds')} fullWidth={true} />
                                                </Grid>
                                              </Grid>
                                            </Grid>
                                        )}
                                          </Grid>
                                        )}
                                    </Grid>
                                  </Grid>
                                  </ExpansionPanelDetails>
                                </ExpansionPanel>
                              </Grid>

                              <Grid item xs={12}>
                                <ExpansionPanel expanded={this.state.showLivenessProbeSettings} onChange={this.handleToggleLivenessProbeSettings()}>
                                  <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                    <Typography>
                                      Liveness Probe
                                    </Typography>
                                  </ExpansionPanelSummary>
                                  <Divider/>
                                  <ExpansionPanelDetails>
                                    <Grid item xs={12}>
                                      <Grid key={this.form.$('livenessProbe').id} container direction={'column'} className={styles.healthProbe}>
                                        <Grid item xs={12}>
                                          <Grid container direction={'row'}>
                                            <Grid item xs={6}>
                                              <SelectField field={this.form.$('livenessProbe.method')} fullWidth={true} />
                                            </Grid>
                                          </Grid>
                                        </Grid>

                                        {this.form.$('livenessProbe.method').value !== 'default' && (
                                          <Grid item xs={12}>
                                          { this.form.$('livenessProbe.method').value === 'exec' && (
                                            <Grid item xs={12}>
                                              <InputField field={this.form.$('livenessProbe.command')} fullWidth={true} />
                                            </Grid>
                                          )}

                                          { this.form.$('livenessProbe.method').value === 'http' && (
                                            <Grid container direction={'row'} spacing={8} justify={'flex-start'}>
                                              <Grid item xs={4}>
                                                <SelectField field={this.form.$('livenessProbe.scheme')} fullWidth={true} />
                                              </Grid>
                                              <Grid item xs={2}>
                                                <InputField field={this.form.$('livenessProbe.port')} fullWidth={true} />
                                              </Grid>
                                              <Grid item xs={12}>
                                                <InputField field={this.form.$('livenessProbe.path')} fullWidth={true} />
                                              </Grid>

                                                <Grid item xs={12}>
                                                  {this.form.$('livenessProbe.httpHeaders').value.length > 0 && (
                                                    <Grid item xs={12}>
                                                      {this.form.$('livenessProbe.httpHeaders').map(header =>
                                                      <Grid container spacing={8} key={header.id}>
                                                          <Grid item xs={6}>
                                                            <InputField field={header.$('name')}/>
                                                          </Grid>
                                                          <Grid item xs={5}>
                                                            <InputField field={header.$('value')}/>
                                                          </Grid>
                                                        <Grid item xs={1}>
                                                          <IconButton>
                                                            <CloseIcon onClick={header.onDel} />
                                                          </IconButton>
                                                        </Grid>
                                                      </Grid>
                                                      )}
                                                    </Grid>
                                                  )}
                                                  <Grid item xs={12} className={styles.addHeaderButton}>
                                                    <Button variant="raised" type="secondary" onClick={this.form.$('livenessProbe.httpHeaders').onAdd}>
                                                        Add Header
                                                    </Button>
                                                  </Grid>
                                                </Grid>
                                            </Grid>
                                          )}

                                          { this.form.$('livenessProbe.method').value === 'tcp' && (
                                            <Grid container justify={'flex-start'}>
                                              <Grid item xs={4}>
                                                <InputField field={this.form.$('livenessProbe.port')} fullWidth={true} />
                                              </Grid>
                                            </Grid>
                                          )}

                                          { this.form.$('livenessProbe.method').value !== "" && (
                                            <Grid container spacing={8} direction={'column'}>

                                              <Grid container spacing={40} direction={'row'} justify={'flex-start'}>
                                                <Grid item xs={6}>
                                                  <InputField field={this.form.$('livenessProbe.successThreshold')} fullWidth={true}/>
                                                </Grid>
                                                <Grid item xs={6}>
                                                  <InputField field={this.form.$('livenessProbe.failureThreshold')} fullWidth={true} />
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={this.form.$('livenessProbe.initialDelaySeconds')} fullWidth={true}/>
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={this.form.$('livenessProbe.periodSeconds')} fullWidth={true} />
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={this.form.$('livenessProbe.timeoutSeconds')} fullWidth={true} />
                                                </Grid>
                                              </Grid>
                                            </Grid>
                                        )}
                                          </Grid>
                                        )}
                                      </Grid>
                                    </Grid>
                                  </ExpansionPanelDetails>
                                </ExpansionPanel>
                              </Grid>

                              <Grid item xs={12}>
                                <ExpansionPanel className={styles.advancedSettingsExpansionPanel} expanded={this.state.showLifecycleSettings} onChange={this.handleToggleLifecycleSettings()}>
                                  <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                    <Typography>
                                        Lifecycle
                                    </Typography>
                                  </ExpansionPanelSummary>
                                  <Divider/>
                                  <ExpansionPanelDetails>
                                    <Grid item xs={12} key={this.form.$('preStopHook').id} className={styles.settingsPanelOpen}>
                                      <Typography variant={"subheading"}>
                                          PreStop ExecHook
                                      </Typography>
                                      <Grid item xs={12}>
                                        <InputField field={this.form.$('preStopHook')} fullWidth={true} />
                                      </Grid>
                                    </Grid>
                                  </ExpansionPanelDetails>
                                </ExpansionPanel>
                              </Grid>

                            </Grid>
                          </ExpansionPanelDetails>
                        </ExpansionPanel>

                    </Grid>
                    <Grid item xs={12}>
                      <Button color="primary"
                          className={styles.buttonSpacing}
                          disabled={this.state.saving}
                          type="submit"
                          variant="raised"
                          onClick={e => this.onSubmit(e)}>
                            Save
                      </Button>
                      {this.form.values()['id'] &&
                        <Button
                          disabled={this.state.saving}
                          color="inherit"
                          onClick={()=>this.setState({ showConfirmDeleteDialog: true })}>
                          Delete
                        </Button>
                      }
                      <Button
                        color="primary"
                        onClick={() => this.handleCancelForm()}>
                        Cancel
                      </Button>
                    </Grid>
                  </Grid>
                </div>
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

        {project.services.entries[this.form.values()['index']] &&
          <Dialog open={this.state.showConfirmDeleteDialog}>
            <DialogTitle>{"Ae you sure you want to delete " + project.services.entries[this.form.values()['index']].name + "?"}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                This will remove the service as well as all its related properties e.g. container ports and commands that you've associated
                with this service.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=> this.setState({ showConfirmDeleteDialog: false })} color="primary">
                Cancel
              </Button>
              <Button onClick={this.handleDeleteService} style={{ color: "red" }}>
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        }
      </div>
    )
  }
}
