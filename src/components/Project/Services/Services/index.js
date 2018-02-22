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
import { MenuItem, MenuList } from 'material-ui/Menu';
import Input from 'material-ui/Input';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import SelectField from 'components/Form/select-field';
import InputField from 'components/Form/input-field';
import RadioField from 'components/Form/radio-field';
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
query Project($slug: String, $environmentId: String) {
  project(slug: $slug, environmentId: $environmentId) {
    id
    services {
      id
      name
      command
      serviceSpec {
        id
        name
      }
      count
      type
      containerPorts {
        port
        protocol
      }
      created
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
      environmentId: props.store.app.currentEnvironment.id,
    }
  })
})

// Mutations
@graphql(gql`
mutation CreateService($projectId: String!, $command: String!, $name: String!, $serviceSpecId: String!,
    $count: String!, $type: String!, $containerPorts: [ContainerPortInput!], $environmentId: String!) {
    createService(service:{
    projectId: $projectId,
    command: $command,
    name: $name,
    serviceSpecId: $serviceSpecId,
    count: $count,
    type: $type,
    containerPorts: $containerPorts,
    environmentId: $environmentId,
    }) {
      id
    }
}`, { name: "createService" })

@graphql(gql`
mutation UpdateService($id: String, $projectId: String!, $command: String!, $name: String!, $serviceSpecId: String!,
    $count: String!, $type: String!, $containerPorts: [ContainerPortInput!], $environmentId: String!) {
    updateService(service:{
    id: $id,
    projectId: $projectId,
    command: $command,
    name: $name,
    serviceSpecId: $serviceSpecId,
    count: $count,
    type: $type,
    containerPorts: $containerPorts,
    environmentId: $environmentId,
    }) {
      id
    }
}`, { name: "updateService" })

@graphql(gql`
mutation DeleteService ($id: String, $projectId: String!, $command: String!, $name: String!, $serviceSpecId: String!,
  $count: String!, $type: String!, $containerPorts: [ContainerPortInput!], $environmentId: String!) {
  deleteService(service:{
  id: $id,
  projectId: $projectId,
  command: $command,
  name: $name,
  serviceSpecId: $serviceSpecId,
  count: $count,
  type: $type,
  containerPorts: $containerPorts,
  environmentId: $environmentId,
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
    }
  }

  handleToggleDrawer(){
    this.setState({ open: !this.state.open })
  }

  componentWillMount(){
    const fields = [
      'id',
      'name',
      'serviceSpecId',
      'count',
      'command',
      'type',
      'projectId',
      'containerPorts',
      'containerPorts[]',
      'containerPorts[].port',
      'containerPorts[].protocol',
      'environmentId',
      'index',
    ];

    const rules = {
      'name': 'string|required',
      'serviceSpecId': 'string|required',
      'command': 'string|required',
      'count': 'numeric|required|min:0',
      'containerPorts[].port': 'numeric|required|between:1,65535',
      'containerPorts[].protocol': 'required',
    };

    const labels = {
      'name': 'Name',
      'serviceSpecId': 'Service Spec',
      'count': 'Count',
      'command': 'Command',
      'containerPorts': 'Container Ports',
      'containerPorts[].port': 'Port',
      'containerPorts[].protocol': 'Protocol',
    };

    const initials = {
      'name': '',
      'command': '',
      'projectId': '',
      'type': 'general',
      'containerPorts[].protocol': 'TCP',
      'count': 0,
      'environmentId': this.props.store.app.currentEnvironment.id,
    }

    const types = {
      'count': 'number',
      'containerPorts[].port': 'number',
    };

    const keys = {};

    const extra = {
      'containerPorts[].protocol': ['TCP', 'UDP']
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
      'containerPorts': $hooks,
      'serviceSpecId': $hooks,
      'containerPorts[]': $hooks,
    };

    const plugins = { dvr: validatorjs };

    this.form = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types, keys }, { plugins });

  }

  onSuccess(form) {
    if(form.values()['id'] !== ""){
      this.props.updateService({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
      })
    } else {
      this.props.createService({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
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
    this.openDrawer()
  };

  openDrawer(){
    this.setState({ drawerOpen: true, addServiceMenuOpen: false })
  }

  closeDrawer(){
    this.form.reset()
    this.form.showErrors(false)
    this.setState({ drawerOpen: false, addServiceMenuOpen: false, saving: false })
  }

  editService(service, index){
    this.form.$('name').set(service.name);
    this.form.$('count').set(service.count);
    this.form.$('command').set(service.command);
    this.form.$('serviceSpecId').set(service.serviceSpec.id);
    this.form.$('containerPorts').set(service.containerPorts);
    this.form.$('type').set(service.type);
    this.form.$('id').set(service.id);
    this.form.$('index').set(index);

    var that = this
    that.form.update({ containerPorts: service.containerPorts });

    this.setState({ drawerOpen: true })
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
    });
  }

  componentWillUpdate(nextProps, nextState){
    nextProps.data.refetch()
  }  

  render() {
    const { loading, project, serviceSpecs } = this.props.data;
    if(loading){
      return (
        <div>
          Loading ...
        </div>
      )
    }
    this.form.$('projectId').set(project.id)
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
                {project.services.map( (service, index) => {
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
                      <TableCell> { service.containerPorts.length}</TableCell>
                      <TableCell> { service.serviceSpec.name}</TableCell>
                      <TableCell> { service.created}</TableCell>
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
                        <InputField field={this.form.$('name')} fullWidth={true} />
                      </Grid>
                      <Grid item xs={12}>
                        <InputField field={this.form.$('command')} fullWidth={true}/>
                      </Grid>
                      <Grid item xs={3}>
                        <InputField field={this.form.$('count')} fullWidth={true}/>
                      </Grid>
                      <Grid item xs={9}>
                        <SelectField field={this.form.$('serviceSpecId')} extraKey={"serviceSpecs"} fullWidth={true} />
                      </Grid>
                      <Grid item xs={12}>
                          <div>
                            <Grid container spacing={24}>
                                { this.form.$('containerPorts').value.length > 0 &&
                                <Grid item xs={12}>
                                <Typography variant="subheading"> Container Ports </Typography>
                                </Grid>
                                }
                                { this.form.$('containerPorts').value.length > 0 &&
                                <Grid item xs={12}>
                                <div>
                                    {this.form.$('containerPorts').map(port =>
                                      <Grid key={port.id} container spacing={24}>
                                        <Grid item xs={4}>
                                          <InputField field={port.$('port')} fullWidth={false} className={styles.containerPortFormInput} />
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
                                <Button variant="raised" type="secondary" onClick={this.form.$('containerPorts').onAdd}>
                                    Add container port
                                </Button>
                                </Grid>
                            </Grid>
                          </div>
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
                        <Button
                          disabled={this.state.saving}
                          color="accent"
                          onClick={()=>this.setState({ dialogOpen: true })}>
                          Delete
                        </Button>
                        <Button
                          color="primary"
                          onClick={this.closeDrawer.bind(this)}>
                          Cancel
                        </Button>
                      </Grid>
                    </Grid>
                  </div>
                </form>
              </div>
          </Drawer>

          {project.services[this.form.values()['index']] &&
            <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
              <DialogTitle>{"Ae you sure you want to delete " + project.services[this.form.values()['index']].name + "?"}</DialogTitle>
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
                <Button onClick={this.handleDeleteService.bind(this)} color="accent">
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>
          }
      </div>
    )
  }
}
