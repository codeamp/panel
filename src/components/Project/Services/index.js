import React from 'react';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import AppBar from 'material-ui/AppBar';
import AddIcon from 'material-ui-icons/Add';
import Drawer from 'material-ui/Drawer';
import IconButton from 'material-ui/IconButton';
import Paper from 'material-ui/Paper';
import Toolbar from 'material-ui/Toolbar';
import CloseIcon from 'material-ui-icons/Close';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import { MenuItem, MenuList } from 'material-ui/Menu';
import Input from 'material-ui/Input';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import ExpansionPanel, {
  ExpansionPanelSummary, ExpansionPanelActions, ExpansionPanelDetails
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

@inject("store") 
@graphql(gql`
query Project($slug: String, $environmentID: String) {
  project(slug: $slug, environmentID: $environmentID) {
    id
    services(params: { limit: 100}){
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
        readinessProbes
        livenessProbes
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
    $deploymentStrategy: DeploymentStrategyInput!, $readinessProbes: [HealthProbeInput], $livenessProbes: [HealthProbeInput]) {
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
    readinessProbes: $readinessProbes,
    livenessProbes: $livenessProbes
    }) {
      id
    }
}`, { name: "createService" })

@graphql(gql`
mutation UpdateService($id: String, $projectID: String!, $command: String!, $name: String!, $serviceSpecID: String!,
    $count: Int!, $type: String!, $ports: [ServicePortInput!], $environmentID: String!,
    $deploymentStrategy: DeploymentStrategyInput!, $readinessProbes: [HealthProbeInput], $livenessProbes: [HealthProbeInput]) {
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
    readinessProbes: $readinessProbes,
    livenessProbes: $livenessProbes
    }) {
      id
    }
}`, { name: "updateService" })

@graphql(gql`
mutation DeleteService ($id: String, $projectID: String!, $command: String!, $name: String!, $serviceSpecID: String!,
  $count: Int!, $type: String!, $ports: [ServicePortInput!], $environmentID: String!,
  $deploymentStrategy: DeploymentStrategyInput!, $readinessProbes: [HealthProbeInput], $livenessProbes: [HealthProbeInput]) {
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
  readinessProbes: $readinessProbes,
  livenessProbes: $livenessProbes
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
      addServiceMenuOpen: false,
      saving: false,
      dialogOpen: false,
      dirtyFormDialogOpen: false,
      showAdvancedSettings: false,
      showDeploymentStrategy: false,
    }
  }

  handleToggleDrawer(){
    this.setState({ open: !this.state.open })
  }

  handleToggleAdvancedSettings = panel => (event) => {
    this.setState({ showAdvancedSettings: !this.state.showAdvancedSettings });
  };

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
      'livenessProbes',
      'livenessProbes[]',
      'livenessProbes[].method',
      'livenessProbes[].command',
      'livenessProbes[].port',
      'livenessProbes[].scheme',
      'livenessProbes[].path',
      'livenessProbes[].initialDelaySeconds',
      'livenessProbes[].periodSeconds',
      'livenessProbes[].timeoutSeconds',
      'livenessProbes[].successThreshold',
      'livenessProbes[].failureThreshold',

      // readinessProbe form inputs
      'readinessProbes',
      'readinessProbes[]',
      'readinessProbes[].method',
      'readinessProbes[].command',
      'readinessProbes[].port',
      'readinessProbes[].scheme',
      'readinessProbes[].path',
      'readinessProbes[].initialDelaySeconds',
      'readinessProbes[].periodSeconds',
      'readinessProbes[].timeoutSeconds',
      'readinessProbes[].successThreshold',
      'readinessProbes[].failureThreshold',
    ];

    const rules = {
      'name': 'string|required',
      'serviceSpecID': 'string|required',
      'command': 'string|required',
      'count': 'numeric|required|min:0',
      'ports[].port': 'numeric|required|between:1,65535',
      'ports[].protocol': 'required',
      'deploymentStrategy.maxUnavailable': "numeric|between:0,100",
      'deploymentStrategy.maxSurge': "numeric|between:0,100",

      'livenessProbes[].method': "string|required",
      'livenessProbes[].command': "string",
      'livenessProbes[].port': 'numeric|between:0,65535',
      'livenessProbes[].scheme': "string",
      'livenessProbes[].path': "string",
      'livenessProbes[].initialDelaySeconds': "numeric|min:0",
      'livenessProbes[].periodSeconds': "numeric|min:0",
      'livenessProbes[].timeoutSeconds': "numeric|min:0",
      'livenessProbes[].successThreshold': "numeric|min:0",
      'livenessProbes[].failureThreshold': "numeric|min:0",

      'readinessProbes[].method': "string|required",
      'readinessProbes[].command': "string",
      'readinessProbes[].port': 'numeric|between:0,65535',
      'readinessProbes[].scheme': "string",
      'readinessProbes[].path': "string",
      'readinessProbes[].initialDelaySeconds': "numeric|min:0",
      'readinessProbes[].periodSeconds': "numeric|min:0",
      'readinessProbes[].timeoutSeconds': "numeric|min:0",
      'readinessProbes[].successThreshold': "numeric|min:0",
      'readinessProbes[].failureThreshold': "numeric|min:0",
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

      'livenessProbes[].method': "Method",
      'livenessProbes[].command': "Command",
      'livenessProbes[].port': "Port",
      'livenessProbes[].scheme': "Scheme",
      'livenessProbes[].path': "Path",
      'livenessProbes[].initialDelaySeconds': "InitialDelaySeconds",
      'livenessProbes[].periodSeconds': "PeriodSeconds",
      'livenessProbes[].timeoutSeconds': "TimeoutSeconds",
      'livenessProbes[].successThreshold': "SuccessThreshold",
      'livenessProbes[].failureThreshold': "FailureThreshold",

      'readinessProbes[].method': "Method",
      'readinessProbes[].command': "Command",
      'readinessProbes[].port': "Port",
      'readinessProbes[].scheme': "Scheme",
      'readinessProbes[].path': "Path",
      'readinessProbes[].initialDelaySeconds': "InitialDelaySeconds",
      'readinessProbes[].periodSeconds': "PeriodSeconds",
      'readinessProbes[].timeoutSeconds': "TimeoutSeconds",
      'readinessProbes[].successThreshold': "SuccessThreshold",
      'readinessProbes[].failureThreshold': "FailureThreshold",
    };

    const initials = formInitials

    const types = {
      'count': 'number',
      'ports[].port': 'number',
      'deploymentStrategy.maxUnavailable': 'number',
      'deploymentStrategy.maxSurge': 'number',

      'livenessProbes[].port': 'number',
      'livenessProbes[].initialDelaySeconds': 'number',
      'livenessProbes[].periodSeconds': 'number',
      'livenessProbes[].timeoutSeconds': 'number',
      'livenessProbes[].successThreshold': 'number',
      'livenessProbes[].failureThreshold': 'number',

      'readinessProbes[].port': 'number',
      'readinessProbes[].initialDelaySeconds': 'number',
      'readinessProbes[].periodSeconds': 'number',
      'readinessProbes[].timeoutSeconds': 'number',
      'readinessProbes[].successThreshold': 'number',
      'readinessProbes[].failureThreshold': 'number',
    };

    const keys = {};

    const extra = {
      'ports[].protocol': ['TCP', 'UDP'],
      'deploymentStrategy.type': [
        {'key': 'default', 'value': 'Default (RollingUpdate, 30%,60%)'},
        {'key': 'recreate', 'value': 'Recreate'},
        {'key': 'rollingUpdate', 'value': 'RollingUpdate'}
      ],
      'readinessProbes[].method': [
        {'key': 'exec', 'value': 'Exec'},
        {'key': 'http', 'value': 'HTTP'},
        {'key': 'tcp', 'value': 'TCP'}
      ],
      'readinessProbes[].scheme': [
        {'key': 'http', 'value': 'HTTP'},
        {'key': 'https', 'value': 'HTTPS'}
      ],
      'livenessProbes[].method': [
        {'key': 'exec', 'value': 'Exec'},
        {'key': 'http', 'value': 'HTTP'},
        {'key': 'tcp', 'value': 'TCP'}
      ],
      'livenessProbes[].scheme': [
        {'key': 'http', 'value': 'HTTP'},
        {'key': 'https', 'value': 'HTTPS'}
      ],
      };

    const $hooks = {
      onAdd(instance) {
        // console.log('-> onAdd HOOK', instance.path || 'form');
      },
      onDel(instance) {
        // console.log('-> onDel HOOK', instance.path || 'form');
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
      }
    };

    const hooks = {
      'ports': $hooks,
      'serviceSpecID': $hooks,
      'ports[]': $hooks,
      'deploymentStrategy': $hooks,
      'readinessProbes[]': $hooks,
      'livenessProbes[]': $hooks,
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
    this.setState({ addServiceMenuOpen: true, anchorEl: event.currentTarget });
  };

  handleServiceRequest = value => {
    this.form.$('type').set(value);
    this.form = this.initProjectServicesForm({
      'type': value,
      'environmentID': this.props.store.app.currentEnvironment.id,
      'deploymentStrategy.type': 'default',
    })    

    this.openDrawer()
  };

  openDrawer(){
    this.setState({ drawerOpen: true, addServiceMenuOpen: false })
  }

  closeDrawer(force = false){
    if(!force && this.form.isDirty){
      this.setState({ dirtyFormDialogOpen: true })
    } else {
      this.setState({ drawerOpen: false, addServiceMenuOpen: false, saving: false, dirtyFormDialogOpen: false })
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
      
    })
    this.form.$('name').set('disabled', true)
    this.form.update({ ports: service.ports })
    this.form.update({readinessProbes: service.readinessProbes})
    this.form.update({livenessProbes: service.livenessProbes})

    if (service.deploymentStrategy.type === "" ) {
      this.form.update({ deploymentStrategy: {type: "default"} })
    } else {
      this.form.update({ deploymentStrategy: service.deploymentStrategy })
    }

    this.openDrawer()
  }

  onSubmit(e) {
    this.setState({ saving: true})
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  handleDeleteService() {
    this.setState({ dialogOpen: false, loading: true })
    this.props.deleteService({
      variables: this.form.values(),
    }).then(({data}) => {
      this.props.data.refetch()
      this.closeDrawer(true)
    });
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
                      <TableCell> { service.type }</TableCell>
                      <TableCell> { service.ports.length}</TableCell>
                      <TableCell> { service.serviceSpec.name}</TableCell>
                      <TableCell> { new Date(service.created).toString()}</TableCell>
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
                aria-owns={this.state.addServiceMenuOpen ? 'menu-list' : null}
                aria-haspopup="true"
                onClick={this.handleClick.bind(this)}>
                <AddIcon />
              </Button>
            </Target>
            <Popper
              placement="bottom-start"
              eventsEnabled={this.state.addServiceMenuOpen}
            >
              <ClickAwayListener onClickAway={()=>this.setState({ addServiceMenuOpen: false })}>
                <Grow in={this.state.addServiceMenuOpen} id="menu-list">
                  <Paper>
                    <MenuList role="menu">
                      <MenuItem onClick={() => this.handleServiceRequest("one-shot")}>One-shot service</MenuItem>
                      <MenuItem onClick={() => this.handleServiceRequest("general")}>General</MenuItem>
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
              onClose={() => {this.closeDrawer()}}
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
                        <SelectField field={this.form.$('serviceSpecID')} extraKey={"serviceSpecs"} fullWidth={true} />
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
                                  <ExpansionPanel className={styles.advancedSettingsExpansionPanel}>
                                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                      <Typography>
                                          Deployment Strategy
                                      </Typography>
                                    </ExpansionPanelSummary>
                                    <ExpansionPanelDetails>

                                        {/* <Grid item xs={12} className={styles.advancedSettingTitle}>
                                              <Typography variant="subheading"> Deployment Strategy </Typography>
                                        </Grid> */}
                                      <Grid item xs={12} className={styles.deploymentStrategyForm} key={this.form.$('deploymentStrategy').id}>
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
                                  <ExpansionPanel>
                                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                      <Typography>
                                        Readiness Probes
                                      </Typography>
                                    </ExpansionPanelSummary>

                                    <ExpansionPanelDetails>
                                      <Grid container spacing={8} direction={'row'}>
                                      { this.form.$('readinessProbes').value.length > 0 && (
                                        <Grid item xs={12}>
                                        
                                        {this.form.$('readinessProbes').map(probe =>
                                          <Grid key={probe.id} container direction={'column'}>
                                            <Grid item xs={12}>
                                              <SelectField field={probe.$('method')} fullWidth={true} />
                                            </Grid>

                                          { probe.$('method').value === 'exec' && (
                                            <Grid item xs={12}>
                                              <InputField field={probe.$('command')} fullWidth={true} />
                                            </Grid>
                                          )}

                                          { probe.$('method').value === 'http' && (
                                            <Grid container direction={'row'} spacing={8} justify={'flex-start'}>
                                              <Grid item xs={4}>
                                                <SelectField field={probe.$('scheme')} fullWidth={true} />
                                              </Grid>
                                              <Grid item xs={2}>
                                                <InputField field={probe.$('port')} fullWidth={true} />
                                              </Grid>
                                              <Grid item xs={12}>
                                                <InputField field={probe.$('path')} fullWidth={true} />
                                              </Grid>
                                            </Grid>
                                          )}

                                          { probe.$('method').value === 'tcp' && (
                                            <Grid container justify={'flex-start'}>
                                              <Grid item xs={4}>
                                                <InputField field={probe.$('port')} fullWidth={true} />
                                              </Grid>
                                            </Grid>
                                          )}

                                          { probe.$('method').value !== "" && (
                                            <Grid container spacing={8} direction={'column'}>
                                              <Grid container spacing={40} direction={'row'} justify={'flex-start'}>
                                                <Grid item xs={3}>
                                                  <InputField field={probe.$('successThreshold')} fullWidth={true}/>
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={probe.$('failureThreshold')} fullWidth={true} />
                                                </Grid>
                                              </Grid>

                                              <Grid container spacing={40} direction={'row'} justify={'flex-start'}>
                                                <Grid item xs={3}>
                                                  <InputField field={probe.$('initialDelaySeconds')} fullWidth={true} />
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={probe.$('periodSeconds')} fullWidth={true} />
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={probe.$('timeoutSeconds')} fullWidth={true} />
                                                </Grid>
                                              </Grid>
                                            </Grid>
                                          )}

                                          <Grid item xs={1} className={styles.removeProbeButton}>
                                            <Button type="submit" style={{color: "red"}} onClick={probe.onDel}>
                                              Remove
                                            </Button>
                                          </Grid>

                                          </Grid>
                                        )}
                                        </Grid>
                                      )}
                                        <Grid item xs={12}>
                                          <Button variant="raised" type="secondary" onClick={this.form.$('readinessProbes').onAdd}>
                                              Add Readiness Probe
                                          </Button>
                                        </Grid>
                                      </Grid>
                                    </ExpansionPanelDetails>
                                  </ExpansionPanel>

                                </Grid>


                                <Grid item xs={12}>
                                  <ExpansionPanel>
                                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                      <Typography>
                                        Liveness Probes
                                      </Typography>
                                    </ExpansionPanelSummary>

                                    <ExpansionPanelDetails>
                                      <Grid container spacing={8} direction={'row'}>
                                      { this.form.$('livenessProbes').value.length > 0 && (
                                        <Grid item xs={12}>
                                        
                                        {this.form.$('livenessProbes').map(probe =>
                                          <Grid key={probe.id} container direction={'column'}>
                                            <Grid item xs={12}>
                                              <SelectField field={probe.$('method')} fullWidth={true} />
                                            </Grid>

                                          { probe.$('method').value === 'exec' && (
                                            <Grid item xs={12}>
                                              <InputField field={probe.$('command')} fullWidth={true} />
                                            </Grid>
                                          )}

                                          { probe.$('method').value === 'http' && (
                                            <Grid container direction={'row'} spacing={8} justify={'flex-start'}>
                                              <Grid item xs={4}>
                                                <SelectField field={probe.$('scheme')} fullWidth={true} />
                                              </Grid>
                                              <Grid item xs={2}>
                                                <InputField field={probe.$('port')} fullWidth={true} />
                                              </Grid>
                                              <Grid item xs={12}>
                                                <InputField field={probe.$('path')} fullWidth={true} />
                                              </Grid>
                                            </Grid>
                                          )}

                                          { probe.$('method').value === 'tcp' && (
                                            <Grid container justify={'flex-start'}>
                                              <Grid item xs={4}>
                                                <InputField field={probe.$('port')} fullWidth={true} />
                                              </Grid>
                                            </Grid>
                                          )}

                                          { probe.$('method').value !== "" && (
                                            <Grid container spacing={8} direction={'column'}>
                                              <Grid container spacing={40} direction={'row'} justify={'flex-start'}>
                                                <Grid item xs={3}>
                                                  <InputField field={probe.$('successThreshold')} fullWidth={true}/>
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={probe.$('failureThreshold')} fullWidth={true} />
                                                </Grid>
                                              </Grid>

                                              <Grid container spacing={40} direction={'row'} justify={'flex-start'}>
                                                <Grid item xs={3}>
                                                  <InputField field={probe.$('initialDelaySeconds')} fullWidth={true} />
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={probe.$('periodSeconds')} fullWidth={true} />
                                                </Grid>
                                                <Grid item xs={3}>
                                                  <InputField field={probe.$('timeoutSeconds')} fullWidth={true} />
                                                </Grid>
                                              </Grid>
                                            </Grid>
                                          )}

                                          <Grid item xs={1} className={styles.removeProbeButton}>
                                            <Button type="submit" style={{color: "red"}} onClick={probe.onDel}>
                                              Remove
                                            </Button>
                                          </Grid>

                                          </Grid>
                                        )}
                                        </Grid>
                                      )}
                                        <Grid item xs={12}>
                                          <Button variant="raised" type="secondary" onClick={this.form.$('livenessProbes').onAdd}>
                                              Add Liveness Probe
                                          </Button>
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
                            onClick={()=>this.setState({ dialogOpen: true })}>
                            Delete
                          </Button>
                        }
                        <Button
                          color="primary"
                          onClick={() => {this.closeDrawer()}}>
                          Cancel
                        </Button>
                      </Grid>
                    </Grid>
                  </div>
                </form>
              </div>
          </Drawer>

          {/* Used for confirmation of escaping panel if dirty form */}
          <Dialog open={this.state.dirtyFormDialogOpen}>
            <DialogTitle>{"Are you sure you want to escape?"}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {"You'll lose any progress made so far."}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=> this.setState({ dirtyFormDialogOpen: false })} color="primary">
                Cancel
              </Button>
              <Button onClick={() => {this.closeDrawer(true)}} style={{ color: "red" }}>
                Confirm
              </Button>
            </DialogActions>
          </Dialog>          

          {project.services.entries[this.form.values()['index']] &&
            <Dialog open={this.state.dialogOpen}>
              <DialogTitle>{"Ae you sure you want to delete " + project.services.entries[this.form.values()['index']].name + "?"}</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  This will remove the service as well as all its related properties e.g. container ports and commands that you've associated
                  with this service.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
                  Cancel
                </Button>
                <Button onClick={this.handleDeleteService.bind(this)} style={{ color: "red" }}>
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>
          }
      </div>
    )
  }
}