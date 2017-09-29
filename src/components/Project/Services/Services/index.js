import React from 'react';

import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import AppBar from 'material-ui/AppBar';
import AddIcon from 'material-ui-icons/Add';
import Drawer from 'material-ui/Drawer';
import Toolbar from 'material-ui/Toolbar';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';
import Menu, { MenuItem } from 'material-ui/Menu';
import Card, { CardContent } from 'material-ui/Card';
import Input from 'material-ui/Input';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';

import SelectField from 'components/Form/select-field';
import InputField from 'components/Form/input-field';
import RadioField from 'components/Form/radio-field';

import { observer } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import styles from './style.module.css';
import { graphql, gql } from 'react-apollo';

const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  }
}

@graphql(gql`
  mutation CreateService ($projectId: String!, $command: String!, $name: String!, $spec: String!,
      $count: String!, $oneShot: Boolean!, $containerPorts: [ContainerPortInput!]) {
      createService(service:{ 
      projectId: $projectId,
      command: $command,
      name: $name,
      serviceSpec: $spec,
      count: $count,
      oneShot: $oneShot,
      containerPorts: $containerPorts
      }) {
          id
          containerPorts {
              port
              protocol
          }
      }
  }
`, { name: "createService" })
@graphql(gql`
  mutation UpdateService ($id: String, $projectId: String!, $command: String!, $name: String!, $spec: String!,
      $count: String!, $oneShot: Boolean!, $containerPorts: [ContainerPortInput!]) {
      updateService(service:{ 
      id: $id,
      projectId: $projectId,
      command: $command,
      name: $name,
      serviceSpec: $spec,
      count: $count,
      oneShot: $oneShot,
      containerPorts: $containerPorts
      }) {
          id
          containerPorts {
              port
              protocol
          }
      }
  }
`, { name: "updateService" })

@graphql(gql`
mutation DeleteService ($id: String, $projectId: String!, $command: String!, $name: String!, $spec: String!,
    $count: String!, $oneShot: Boolean!, $containerPorts: [ContainerPortInput!]) {
    deleteService(service:{ 
    id: $id,
    projectId: $projectId,
    command: $command,
    name: $name,
    serviceSpec: $spec,
    count: $count,
    oneShot: $oneShot,
    containerPorts: $containerPorts
    }) {
        id
        containerPorts {
            port
            protocol
        }
    }
}
`, { name: "deleteService" })


@observer
export default class Services extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      open: false,
      anchorEl: null,
      addServiceMenuOpen: false,
      oneShot: false,
      currentService: { id: -1 },
      loading: false,
      drawerText: 'Create',
      dialogOpen: false,
    }
  }

  handleToggleDrawer(){
    this.setState({ open: !this.state.open })
  }

  componentWillMount(){
    console.log('mounting services tab...')

    const fields = [
      'id',
      'name',
      'spec',
      'count',
      'command',
      'oneShot',
      'projectId',
      'containerPorts',
      'containerPorts[]',
      'containerPorts[].port',
      'containerPorts[].protocol',
    ];

    const rules = {
      'name': 'string|required',
      'spec': 'string|required',
      'command': 'string|required',
      'count': 'numeric|required|min:0',
      'containerPorts[].port': 'numeric|required|between:1,65535',
      'containerPorts[].protocol': 'required',
    };

    const labels = {
      'name': 'Name',
      'spec': 'Service Spec',
      'count': 'Count',
      'command': 'Command',
      'containerPorts': 'Container Ports',
      'containerPorts[].port': 'Port',
      'containerPorts[].protocol': 'Protocol',
    };

    const initials = {
      'name': '',
      'spec': 'Uber Worker',
      'command': '',      
      'projectId': this.props.project.id,
      'oneShot': this.state.oneShot,
      'containerPorts[].protocol': 'TCP',
    }

    const types = {
      'count': 'number',
      'containerPorts[].port': 'number',
    };

    const extra = {
      'spec': ['General-purpose', 'Console', 'General-purpose - L', 
        'General-purpose - XL', 'Long running worker - XL', 'General-purpose - XXL', 'Uber Worker'],
        'containerPorts[].protocol': ['TCP', 'UDP']
    };

    const $hooks = {
      onAdd(instance) {
        console.log('-> onAdd HOOK', instance.path || 'form');
      },
      onDel(instance) {
        console.log('-> onDel HOOK', instance.path || 'form');
      },    
      onSubmit(instance){
        console.log('-> onSubmit HOOK', instance.path || 'form');
      },
      onSuccess(instance){
        console.log('Form Values!', instance.values())
      }
    };

    const hooks = {
      'containerPorts': $hooks,
      'containerPorts[]': $hooks,
    };

    const plugins = { dvr: validatorjs };

    this.serviceForm = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { plugins });                
  }

  componentDidMount(){
    console.log("Resources")
  }

  addService() {
    console.log("HELLO")
  }

  onSuccess(form) {
    console.log(form.values())
    let values = form.values();
    if(values.id !== ""){      
      this.props.updateService({
        variables: form.values(),
      }).then(({data}) => {
        console.log(data)
      }).catch(error => {
        console.log(error)
      });      
    } else {
      this.props.createService({
        variables: form.values(),
      }).then(({data}) => {
        console.log(data)
      }).catch(error => {
        console.log(error)
      });
    }
  }

  onError(form) {
    // get all form errors
    console.log('All form errors', form.errors());
    // invalidate the form with a custom error message
    let drawerText = "Update"
    if(this.state.drawerText === "Creating"){
      drawerText = "Create"
    }

    this.setState({ loading: false, drawerText: drawerText})
    form.invalidate('This is a generic error message!');
  }    

  handleClick = event => {
    console.log(this.props)
    this.serviceForm.$('containerPorts').clear()
    console.log("HANDLECLICK!")
    this.setState({ addServiceMenuOpen: true, anchorEl: event.currentTarget, currentService: { id: -1 }, drawerText: 'Create' });
  };

  handleRequestClose = value => {
    let oneShot = false;
    if(value === "one-shot"){
      oneShot = true;
    }
    this.serviceForm.clear()

    this.serviceForm.$('oneShot').set(oneShot);

    this.setState({ addServiceMenuOpen: false, oneShot: oneShot, open: true });
  };

  editService = service => {
    console.log(service)
    this.serviceForm.$('name').set(service.name);
    this.serviceForm.$('count').set(service.count);
    this.serviceForm.$('command').set(service.command);
    this.serviceForm.$('spec').set(service.serviceSpec);
    this.serviceForm.$('containerPorts').set(service.containerPorts);
    this.serviceForm.$('oneShot').set(service.oneShot);
    this.serviceForm.$('id').set(service.id);

    var that = this
    that.serviceForm.update({ containerPorts: service.containerPorts });

    this.setState({ open: true, currentService: service, oneShot: service.oneShot, drawerText: 'Update' })
  }

  onSubmit(e) {
    let drawerText = 'Creating'
    if(this.state.drawerText === 'Update'){
      drawerText = 'Updating'
    }
    this.setState({ drawerText: drawerText, loading: true})
    this.serviceForm.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })    
  }

  handleDeleteService() {
    this.setState({ dialogOpen: false, loading: true })
    this.props.deleteService({
      variables: this.serviceForm.values(),
    }).then(({data}) => {
      console.log(data)
    }).catch(error => {
      console.log(error)
    });
    console.log('handleDeleteService');
  }

  render() {
    const { services } = this.props.project;

    console.log(this.props.project);

    this.serviceForm.$('projectId').set(this.props.project.id);

    let addContainerPorts = ""
    console.log(this.state.oneShot);
    if(this.state.oneShot === false){
        addContainerPorts = (
            <div>
            <Grid container spacing={24}>
                { this.serviceForm.$('containerPorts').value.length > 0 &&
                <Grid item xs={12}>
                <Typography type="subheading"> Container Ports </Typography>
                </Grid>
                }
                { this.serviceForm.$('containerPorts').value.length > 0 &&                
                <Grid item xs={12}>
                <div>
                    {this.serviceForm.$('containerPorts').map(port =>
                      <Grid container spacing={24}>
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
                <Button raised type="secondary" onClick={this.serviceForm.$('containerPorts').onAdd}>
                    Add container port
                </Button>
                </Grid>
            </Grid>
            </div>
        )
    }

    let deleteButton = "";

    if(this.state.currentService.id !== -1){
      deleteButton = (
        <Button 
          disabled={this.state.loading}
          color="accent" 
          onClick={()=>this.setState({ dialogOpen: true })}>
          Delete
        </Button>        
      );
    }

    return (
      <div>                         
          {services.map(service => (
            <Card 
              className={(this.state.currentService.id === service.id) === true ? styles.serviceViewHighlighted : styles.serviceView} 
              onClick={() => this.editService(service)}>
              <CardContent>
                <Typography type="title">
                  {service.name}
                </Typography>
                <Grid container spacing={24}>
                  <Grid item xs={1}>
                    <Input disabled value={service.count + 'x'} className={styles.serviceCount} />
                  </Grid>
                  <Grid item xs={11}>
                    <Input disabled value={service.command} className={styles.commandDisplay} />
                  </Grid>                                
                </Grid>
              </CardContent>
            </Card>                  
          ))}
          
          <Button fab aria-label="Add" type="submit" raised color="primary" 
              style={inlineStyles.addButton}
              onClick={this.handleClick.bind(this)}>
              <AddIcon />
          </Button>   
          
          <Menu
              id="simple-menu"
              anchorEl={this.state.anchorEl}
              open={this.state.addServiceMenuOpen}
              onRequestClose={this.handleRequestClose}
          >
              <MenuItem onClick={() => this.handleRequestClose("one-shot")}>One-shot service</MenuItem>                    
              <MenuItem onClick={() => this.handleRequestClose("general")}>General</MenuItem>                    
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
                        {this.state.drawerText} Service
                    </Typography>
                    </Toolbar>                        
                </AppBar>
                <form onSubmit={this.serviceForm.onSubmit}>
                  <div className={styles.drawerBody}>
                    <Grid container spacing={24} className={styles.grid}>
                      <Grid item xs={12}>
                        <InputField field={this.serviceForm.$('name')} fullWidth={true} />
                      </Grid>
                      <Grid item xs={12}>
                        <InputField field={this.serviceForm.$('command')} fullWidth={true}/>                      
                      </Grid>                                
                      <Grid item xs={3}>
                        <InputField field={this.serviceForm.$('count')}/>                                                          
                      </Grid>
                      <Grid item xs={9}>
                        <SelectField field={this.serviceForm.$('spec')} />
                      </Grid>
                      <Grid item xs={12}>
                        { addContainerPorts }
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
                      </Grid>                
                    </Grid>                          
                  </div>
                </form>
              </div>
          </Drawer>            

          <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
            <DialogTitle>{"Ae you sure you want to delete " + this.state.currentService.name + "?"}</DialogTitle>
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
      </div>            
    )
  }
}