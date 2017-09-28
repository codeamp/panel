import React from 'react';

import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import IconButton from 'material-ui/IconButton';
import Button from 'material-ui/Button';
import Tabs, { Tab } from 'material-ui/Tabs';
import AppBar from 'material-ui/AppBar';
import AddIcon from 'material-ui-icons/Add';
import TextField from 'material-ui/TextField';
import Drawer from 'material-ui/Drawer';
import Toolbar from 'material-ui/Toolbar';
import { FormLabel } from 'material-ui/Form';
import Menu, { MenuItem } from 'material-ui/Menu';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import Input from 'material-ui/Input';


import CloseIcon from 'material-ui-icons/Close';
import RoomServiceIcon from 'material-ui-icons/RoomService';

import InputField from 'components/Form/input-field';
import SelectField from 'components/Form/select-field';
import RadioField from 'components/Form/radio-field';

import { observer, observable } from 'mobx-react';
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


function TabContainer(props) {
    return <div style={{ padding: 20 }}>{props.children}</div>;
}

@observer
class ContainerPortFormInput extends React.Component {
    
    constructor(props){
        super(props)
    }

    render(){
        const { field, index } = this.props;
        var that = this

        return (
            <div key={this.props.key}>      
                <Grid container spacing={24}>
                    <Grid item xs={4}>
                        <InputField field={field.$('port')} fullWidth={false} className={styles.containerPortFormInput} />               
                    </Grid>
                    <Grid item xs={6}>                        
                        <RadioField field={field.$('protocol')} />
                    </Grid>
                    <Grid item xs={1}>
                        <IconButton>
                            <CloseIcon onClick={field.onDel} />
                        </IconButton>
                    </Grid>
                </Grid>
            </div>
        )
    }
}

@observer
class AddContainerPorts extends React.Component {

    constructor(props){
        super(props)
    }

    render(){
        const { ports } = this.props;
        console.log(ports);
        console.log("HELLOO THERE")

        let containerPortInputs = (
            <div>
                {ports.map(port =>
                    <ContainerPortFormInput
                        field={port}
                        key={port.key}
                    />
                )}
            </div>
        )   

        return (
            <div>
                <Grid container spacing={24}>
                { ports.value.length > 0 &&
                    <Grid item xs={12}>
                        <Typography type="subheading"> Container Ports </Typography>
                    </Grid>
                }
                { ports.value.length > 0 &&                
                    <Grid item xs={12}>
                        { containerPortInputs } 
                    </Grid>
                }
                    

                    <Grid item xs={12}>
                        <Button raised type="secondary" onClick={ports.onAdd}>
                            Add container port
                        </Button>
                    </Grid>
                </Grid>
            </div>
        )
    }
}

@observer
class ServiceView extends React.Component {
    render() {

        const { service } = this.props;
        console.log(service)
        console.log(this.props)

        return (
            <Card 
                className={this.props.highlighted == true ? styles.serviceViewHighlighted : styles.serviceView} 
                  onClick={() => this.props.editService(service)}>
                <CardContent>
                        <Typography type="title">
                            {service.name}
                        </Typography>
                        <Grid container spacing={24}>
                            <Grid item xs={1}>
                                <Input disabled value={service.count + 'x'} className={styles.serviceCount} />
                            </Grid>
                            <Grid item xs={10}>
                                <Input disabled value={service.command} />
                            </Grid>                                
                        </Grid>
                </CardContent>
            </Card>
        )
    }
}

@graphql(gql`
mutation Mutation($projectId: String!, $command: String!, $name: String!, $spec: String!,
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
`)

@observer
class ServicesTab extends React.Component {

    constructor(props){
        super(props)
        this.state = {
            open: false,
            anchorEl: null,
            addServiceMenuOpen: false,
            oneShot: false,
            currentService: { index: -1 },
        }
    }

    handleToggleDrawer(){
        this.setState({ open: !this.state.open })
    }

    componentWillMount(){
        console.log('mounting services tab...')

        const fields = [
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
        console.log(form.values(), 'onSuccess')
        var that = this;
        this.props.mutate({
            variables: form.values(),
          }).then(({data}) => {
              console.log(data)
          }).catch(error => {
              console.log(error)
          });
    }
    
    onError(form) {
        // get all form errors
        console.log('All form errors', form.errors());
        // invalidate the form with a custom error message
        form.invalidate('This is a generic error message!');
    }    

    handleClick = event => {
        console.log(this.props)
        this.setState({ addServiceMenuOpen: true, anchorEl: event.currentTarget });
    };
    
    handleRequestClose = value => {
        let oneShot = false;
        if(value == "one-shot"){
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
        
        var that = this
        that.serviceForm.update({ containerPorts: service.containerPorts });

        this.setState({ open: true, currentService: service, oneShot: service.oneShot })
    }

    render() {
        const { services } = this.props.project;

        console.log(this.props.project);
        
        this.serviceForm.$('projectId').set(this.props.project.id);

        let addContainerPorts = ""
        console.log(this.state.oneShot);
        if(this.state.oneShot == false){
            addContainerPorts = ( <AddContainerPorts ports={this.serviceForm.$('containerPorts')} /> )
        }
        return (
            <div>                         
                {services.map((service, index) => (
                    <ServiceView 
                        editService={this.editService}
                        key={index}
                        id={index}
                        highlighted={this.state.currentService.index == index}
                        service={service} />
                ))}
                <Button fab color="primary" aria-label="Add" type="submit" raised color="primary" 
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
                                Create Service
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
                                            type="submit" raised onClick={e => this.serviceForm.onSubmit(e, { onSuccess: this.props.onSuccess, onError: this.props.onError })}>
                                            Create
                                        </Button>                                                                                                  
                                        <Button color="primary" color="primary" onClick={this.handleToggleDrawer.bind(this)}>
                                            Cancel
                                        </Button>                                         
                                    </Grid>
                                </Grid>                          
                            </div>
                        </form>
                    </div>
                </Drawer>                                                                                                              
            </div>            
        )
    }
}

@observer
export default class Services extends React.Component {

    constructor(props){
        super(props)
        this.state = {
            value: 0,
        }
    }

    handleChange(event, value) {
        this.setState({ value })
    }

    render() {
        const { value } = this.state;
        const { project, store } = this.props;
        
        console.log(project)

        return (
            <div className={styles.root}>
                <AppBar position="static" className={styles.appBar}>
                    <Tabs value={value} onChange={this.handleChange.bind(this)}>
                        <Tab label="Services" />
                        <Tab label="Environment" />
                    </Tabs>
                </AppBar>               
                <Grid container spacing={24}>                                                            
                    <Grid item sm={12}>                    
                        {value === 0 && <TabContainer> <ServicesTab project={project} store={store} /> </TabContainer>}
                    </Grid>
                    <Grid item sm={12}>
                        {value === 1 && <TabContainer>{'Environment Variables'}</TabContainer>}
                    </Grid>
                </Grid>            
            </div>
        )
    }
}