import React from 'react';

import  Card, { CardContent } from 'material-ui/Card';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Button from 'material-ui/Button';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';

import AddIcon from 'material-ui-icons/Add';

import SelectField from 'components/Form/select-field';
import InputField from 'components/Form/input-field';
import RadioField from 'components/Form/radio-field';

import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';

import { graphql, gql } from 'react-apollo';


const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  }
}



@graphql(gql`
mutation CreateServiceSpec ($name: String!, $cpuRequest: String!, $cpuLimit: String!, 
  $memoryRequest: String!, $memoryLimit: String!, $terminationGracePeriod: String!) {
    createServiceSpec(serviceSpec:{ 
    name: $name,
    cpuRequest: $cpuRequest,
    cpuLimit: $cpuLimit,
    memoryRequest: $memoryRequest,
    memoryLimit: $memoryLimit,
    terminationGracePeriod: $terminationGracePeriod,
    }) {
        id
        name
    }
}
`, { name: "createServiceSpec" })

@graphql(gql`
mutation DeleteServiceSpec ($id: String!, $name: String!, $cpuRequest: String!, $cpuLimit: String!, 
  $memoryRequest: String!, $memoryLimit: String!, $terminationGracePeriod: String!) {
    deleteServiceSpec(serviceSpec:{ 
    id: $id,
    name: $name,
    cpuRequest: $cpuRequest,
    cpuLimit: $cpuLimit,
    memoryRequest: $memoryRequest,
    memoryLimit: $memoryLimit,
    terminationGracePeriod: $terminationGracePeriod,
    }) {
        id
        name
    }
}
`, { name: "deleteServiceSpec" })

@graphql(gql`
mutation UpdateServiceSpec ($id: String!, $name: String!, $cpuRequest: String!, $cpuLimit: String!, 
  $memoryRequest: String!, $memoryLimit: String!, $terminationGracePeriod: String!) {
    updateServiceSpec(serviceSpec:{ 
    id: $id,
    name: $name,
    cpuRequest: $cpuRequest,
    cpuLimit: $cpuLimit,
    memoryRequest: $memoryRequest,
    memoryLimit: $memoryLimit,
    terminationGracePeriod: $terminationGracePeriod,
    }) {
        id
        name
    }
}
`, { name: "updateServiceSpec" })

@inject("store") @observer

export default class ServiceSpecs extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      selected: null,
      open: false,
      currentServiceSpec: { 
        id: -1,
      },
      drawerText: 'Create',
    }    
  }

  componentDidMount(){
    this.props.socket.on("serviceSpecs/new", (data) => {
      console.log("serviceSpecs/new");
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();        
        this.setState({ loading: false })    
        this.props.store.app.setSnackbar({msg: "Service spec "+ data.name +" was created"})
      }, 2000);
    }) 
    
    this.props.socket.on("serviceSpecs/deleted", (data) => {
      console.log("serviceSpecs/deleted");
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();    
        this.setState({ loading: false })    
        this.props.store.app.setSnackbar({msg: "Service spec "+ data.name +" was deleted"})
      }, 2000);
    }) 
    
    this.props.socket.on("serviceSpecs/updated", (data) => {
      console.log("serviceSpecs/updated");
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();        
        this.setState({ loading: false })    
        this.props.store.app.setSnackbar({msg: "Service spec "+ data.name +" was updated"})
      }, 2000);
    })     
  }

  componentWillMount(){
    console.log(this.props);

    const fields = [
      'name',
      'cpuRequest',
      'cpuLimit',
      'memoryRequest',
      'memoryLimit',
      'terminationGracePeriod',
      'id',
    ];

    const rules = {
      'name': 'required|string',
      'cpuRequest': 'required|string',
      'cpuLimit': 'required|string',
      'memoryRequest': 'required|string',
      'memoryLimit': 'required|string',
      'terminationGracePeriod': 'required|string',
    };

    const labels = {
      'name': 'Name',
      'cpuRequest': 'CPU Request',
      'cpuLimit': 'CPU Limit',
      'memoryRequest': 'Memory Request',
      'memoryLimit': 'Memory Limit',
      'terminationGracePeriod': 'Termination Grace Period',
    };

    const initials = {

    };

    const types = {

    };

    const extra = {

    };

    const $hooks = {

    };

    const hooks = {

    };

    const plugins = { dvr: validatorjs };

    this.serviceSpecForm = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { plugins })
  }

  handleToggleDrawer(){
    console.log(this.state.open, this.serviceSpecForm.values())
    if(this.state.open == true){
      this.serviceSpecForm.clear()
    }
    console.log(this.serviceSpecForm.values())

    this.setState({ open: !this.state.open, dialogOpen: false, currentServiceSpec: { id: -1 } })
  }  

  isSelected(id){
    return this.state.selected == id
  }
  handleClick(e, serviceSpec){
    console.log(serviceSpec)
    this.serviceSpecForm.$('name').set(serviceSpec.name);
    this.serviceSpecForm.$('cpuRequest').set(serviceSpec.cpuRequest);
    this.serviceSpecForm.$('cpuLimit').set(serviceSpec.cpuLimit);
    this.serviceSpecForm.$('memoryRequest').set(serviceSpec.memoryRequest);
    this.serviceSpecForm.$('memoryLimit').set(serviceSpec.memoryLimit);
    this.serviceSpecForm.$('terminationGracePeriod').set(serviceSpec.terminationGracePeriod);
    this.serviceSpecForm.$('id').set(serviceSpec.id);

    console.log(this.serviceSpecForm)

    this.setState({ selected: serviceSpec.id, open: true, currentServiceSpec: serviceSpec, drawerText: 'Update' })
  }

  handleNewSpecClick(e){
    this.setState({ open: true, drawerText: 'Create' })
  }

  onSuccess(form){
    console.log('onSuccess')
    this.setState({ loading: true })
    var that = this
    switch(this.state.drawerText){
      case "Creating":
        this.props.createServiceSpec({
          variables: form.values(),
        }).then(({data}) => {
          that.handleToggleDrawer()
        }).catch(error => {
          console.log(error)
        });
        break;
      case "Updating":
        this.props.updateServiceSpec({
          variables: form.values(),
        }).then(({data}) => {
          console.log(data)
        }).catch(error => {
          console.log(error)
        });
        break;   
    }
  }

  handleDeleteServiceSpec() {
    console.log('handleDeleteServiceSpec')
    this.setState({ loading: true })
    var that = this
    this.props.deleteServiceSpec({
      variables: this.serviceSpecForm.values(),
    }).then(({ data }) => {
      that.handleToggleDrawer()
    }).catch(error => {
      console.log(error)
    });
  }

  onError(){
    console.log('onError')
  }

  onSubmit(e){

    let drawerText = this.state.drawerText
    switch(this.state.drawerText){
      case "Create":
        drawerText = "Creating"
        break;
      case "Update": 
        drawerText = "Updating"
        break;
    }

    this.setState({ drawerText: drawerText })
    this.serviceSpecForm.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })    
  }

  render() {
    const { serviceSpecs } = this.props;


    let deleteButton = "";

    if(this.state.currentServiceSpec.id !== -1){
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
      <div className={styles.root}>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <Paper>
              <Toolbar>
                <div>
                  <Typography type="title">
                    Service Specs
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
                      CPU Request
                    </TableCell>
                    <TableCell>
                      CPU Limit
                    </TableCell>
                    <TableCell>
                      Memory Request (mb)
                    </TableCell>
                    <TableCell>
                      Memory Limit (mb)
                    </TableCell>                                                                                  
                    <TableCell>
                      Timeout (s)
                    </TableCell>                                                            
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serviceSpecs.map(serviceSpec => {
                    const isSelected = this.isSelected(serviceSpec.id);
                    return (
                      <TableRow 
                        hover
                        onClick={event => this.handleClick(event, serviceSpec)}
                        selected={isSelected}
                        tabIndex={-1}
                        key={serviceSpec.id}>
                        <TableCell> { serviceSpec.name} </TableCell>
                        <TableCell> { serviceSpec.cpuRequest}</TableCell>
                        <TableCell> { serviceSpec.cpuLimit} </TableCell>
                        <TableCell> { serviceSpec.memoryRequest}</TableCell>
                        <TableCell> { serviceSpec.memoryLimit}</TableCell>
                        <TableCell> { serviceSpec.terminationGracePeriod}</TableCell>
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
              onClick={this.handleNewSpecClick.bind(this)}>
              <AddIcon />
        </Button>           
        <Drawer
          type="persistent"
          anchor="right"
          classes={{
            paper: styles.drawer
          }}
          open={this.state.open}
        >
            <div className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                <Toolbar>
                  <Typography type="title" color="inherit">
                    {this.state.drawerText} Service Spec
                  </Typography>
                </Toolbar>
              </AppBar>
              <form onSubmit={(e) => e.preventDefault()}>
                <Grid container spacing={24} className={styles.grid}>
                  <Grid item xs={12}>
                    <Typography type="body1">
                      Requests and Limits are measured in megabytes.
                    </Typography>
                  </Grid>                  
                  <Grid item xs={12}>
                    <InputField field={this.serviceSpecForm.$('name')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={6}>
                    <InputField field={this.serviceSpecForm.$('cpuRequest')} fullWidth={true} />                      
                  </Grid>                                
                  <Grid item xs={6}>
                    <InputField field={this.serviceSpecForm.$('cpuLimit')} fullWidth={true} />                                                          
                  </Grid>
                  <Grid item xs={6}>
                    <InputField field={this.serviceSpecForm.$('memoryRequest')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={6}>
                    <InputField field={this.serviceSpecForm.$('memoryLimit')} fullWidth={true} />
                  </Grid>                  
                  <Grid item xs={6}>
                    <InputField field={this.serviceSpecForm.$('terminationGracePeriod')} fullWidth={true} />
                  </Grid>                                    
                  <Grid item xs={12}>
                    <Button color="primary" 
                        className={styles.buttonSpacing}
                        disabled={this.state.loading}
                        type="submit" 
                        raised 
                        onClick={this.onSubmit.bind(this)}>
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
              </form>
            </div>
        </Drawer>

        <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
          <DialogTitle>{"Ae you sure you want to delete " + this.state.currentServiceSpec.name + "?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will remove the service spec and all instances in which it is being used in any existing services.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleDeleteServiceSpec.bind(this)} color="accent">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>                                                                                                

      </div>
    );
  }
}
