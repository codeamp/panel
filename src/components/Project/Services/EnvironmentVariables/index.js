import React from 'react';

import Typography from 'material-ui/Typography';
import { FormControl, FormHelperText } from 'material-ui/Form';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Input, { InputLabel } from 'material-ui/Input';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import Menu, { MenuItem } from 'material-ui/Menu';

import InputField from 'components/Form/input-field';

import CloseIcon from 'material-ui-icons/Close';
import EditIcon from 'material-ui-icons/ModeEdit';
import AddIcon from 'material-ui-icons/Add';

import styles from './style.module.css';
import { observer } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql, gql } from 'react-apollo';

const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
  }
}
const DEFAULT_ENV_VAR = { id: -1, versions: [] }

@graphql(gql`
  mutation CreateEnvironmentVariable ($key: String!, $value: String!, $projectId: String!, $type: String!) {
      createEnvironmentVariable(environmentVariable:{ 
      projectId: $projectId,
      key: $key,
      value: $value,
      type: $type,
      }) {
          id
          key
          value
          user {
            id
            email
          }
          project {
            id
            name
          }
          version
          created
      }
  }
`, { name: "createEnvironmentVariable" })

@graphql(gql`
mutation UpdateEnvironmentVariable ($id: String!, $key: String!, $value: String!) {
    updateEnvironmentVariable(environmentVariable:{ 
    id: $id,
    key: $key, 
    value: $value,
    }) {
        id
        key
        value
        user {
          id
          email
        }
        project {
          id
          name
        }
        version
        created
    }
}
`, { name: "updateEnvironmentVariable" })

@observer
export default class EnvironmentVariables extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      currentEnvVar: DEFAULT_ENV_VAR,
      drawerText: "Create",
      addEnvVarMenuOpen: false,
      loading: false,
      open: false,
    }
  }

  componentWillMount(){
    console.log('mounting environment variables tab...')
    console.log(this.props)

    const fields = [
      'id',
      'projectId',
      'key',
      'value',
      'created',
      'version',
      'type',
    ];

    const rules = {
    'key': ['string', 'required', 'regex:/^\S*$/'],
      'value': 'string|required',
    };

    const labels = {
      'key': 'Key',
      'value': 'Value',
      'version': 'Version',
    };

    const initials = {
      'projectId': this.props.project.id,
    }

    const types = {
    };

    const keys = {
    };

    const disabled = {
      'key': false
    }

    const extra = {
      'type': [{key: 'Build', value: 'Build'}, {key: 'Normal', value: 'Normal' },{key: 'File', value: 'File'}]
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
      },
      sync(instance){
        console.log('sync', instance)
      },
      onChange(instance){
        console.log(instance)
        console.log(instance.values())
      }
    };

    const hooks = {
    };

    const plugins = { dvr: validatorjs };

    this.envVarForm = new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys }, { plugins });                
  }  

  handleAddClick(event){
    console.log('handleAddClick')
    this.setState({ addEnvVarMenuOpen: true, anchorEl: event.currentTarget, currentService: { id: -1 }, drawerText: 'Create' });
  }

  onSubmit(e) {
    let drawerText = ""
    if(this.state.drawerText === "Create"){
      drawerText = "Creating"
    }
    if(this.state.drawerText === "Update"){
      drawerText = "Updating"
    }

    this.setState({ loading: true, drawerText: drawerText })    
    
    this.envVarForm.$('key').set('disabled', false)
    
    this.envVarForm.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })    
  }

  onClick(envVar){
    console.log('onClick', envVar)
    this.envVarForm.$('key').set(envVar.key)
    this.envVarForm.$('value').set(envVar.value)
    this.envVarForm.$('type').set(envVar.type)
    this.envVarForm.$('id').set(envVar.id)
    this.envVarForm.$('key').set('disabled', true)

    this.setState({ open: true, currentEnvVar: envVar, drawerText: "Update" })
  }

  onError(form){
    console.log(form)
    console.log('onError!')
    this.envVarForm.$('key').set('disabled', true)
    console.log('All form errors', form.errors());
  }

  onSuccess(form){
    console.log('onSuccess!')
    console.log(this.state)
    console.log(form.values())
    
    this.envVarForm.$('key').set('disabled', false)
        
    var self = this;
    if(this.state.drawerText === "Creating"){
      this.props.createEnvironmentVariable({
        variables: form.values(),
      }).then(({data}) => {
        console.log(data)
      }).catch(error => {
        console.log(error)
      });
    }

    if(this.state.drawerText === "Updating"){
      this.props.updateEnvironmentVariable({
        variables: form.values(),
      }).then(({data}) => {
        console.log(data)
      }).catch(error => {
        console.log(error)
      });      
    }
  }

  handleRequestClose = value => {
    this.envVarForm.reset()
    this.envVarForm.$('type').set(value);
    this.envVarForm.$('key').set('disabled', false)
    this.setState({ addEnvVarMenuOpen: false, open: true, currentEnvVar: DEFAULT_ENV_VAR});
  };

  isSelected(id){
    return this.state.selected == id;
  }

  handleToggleDrawer(){
    console.log('handleToggleDrawer')
    this.setState({ open: !this.state.open })
  }

  handleDeleteEnvVar(){
    console.log('handleDeleteEnvVar')

    this.setState({ dialogOpen: false })
  }

  render() {

    const { environmentVariables } = this.props.project;

    let deleteButton = "";

    if(this.state.currentEnvVar.id !== -1){
      deleteButton = (
        <Button 
          disabled={this.state.loading}
          color="accent" 
          onClick={()=>this.setState({ dialogOpen: true })}>
          Delete
        </Button>        
      );
    }

    var self = this;

    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <div>
              <Typography type="title">
                Environment Variables
              </Typography>
            </div>
          </Toolbar>
          <Table bodyStyle={{ overflow: 'visible' }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  Key
                </TableCell>
                <TableCell>
                  Type
                </TableCell>                
                <TableCell>
                  Creator
                </TableCell>                                                
                <TableCell>
                  Created At
                </TableCell>                                                                
                <TableCell>
                  Version
                </TableCell>                                                                
              </TableRow>
            </TableHead>
            <TableBody>
              {environmentVariables.map(envVar => {
                return (
                  <TableRow
                    hover 
                    tabIndex={-1}
                    onClick={()=> this.onClick(envVar)}
                    key={envVar.id}>
                    <TableCell>
                      {envVar.key}
                    </TableCell>

                    <TableCell>
                      {envVar.type}
                    </TableCell>

                    <TableCell>
                      {envVar.user.email}
                    </TableCell>

                    <TableCell>
                      {envVar.created}
                    </TableCell>                                                                                

                    <TableCell>
                      {envVar.version}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>

        <Button fab aria-label="Add" type="submit" raised color="primary" 
            style={inlineStyles.addButton}
            onClick={this.handleAddClick.bind(this)}>
            <AddIcon />
        </Button>   

        <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={this.state.addEnvVarMenuOpen}
            onRequestClose={this.handleRequestClose}
        >
          <MenuItem onClick={() => this.handleRequestClose("normal")}>Normal</MenuItem>                            
          <MenuItem onClick={() => this.handleRequestClose("build-arg")}>Build Arg</MenuItem>                    
          <MenuItem onClick={() => this.handleRequestClose("file")}>File</MenuItem>                    
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
                      {this.state.drawerText} Environment Variable
                  </Typography>
                  </Toolbar>                        
              </AppBar>
              <form>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24} className={styles.grid}>
                    
                    {this.state.currentEnvVar.id !== -1 &&
                      <Grid item xs={12}>  
                        <Typography type="subheading"> Current Version: {this.state.currentEnvVar.version} </Typography>
                      </Grid>
                    }
                    <Grid item xs={6}>  
                      <InputField field={this.envVarForm.$('key')} fullWidth={false} />
                    </Grid>
                    <Grid item xs={6}>
                      <InputField field={this.envVarForm.$('value')} fullWidth={false} />
                    </Grid>                                
                    <Grid item xs={12}>
                      <Button color="primary" 
                          className={styles.buttonSpacing}
                          disabled={this.state.loading || this.envVarForm.$('value').value === this.state.currentEnvVar.value}
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
                    {this.state.currentEnvVar.id !== -1 &&
                      <Grid item xs={12}>
                          <Paper className={styles.tablePaper}>
                          <Toolbar>
                            <div>
                              <Typography type="title">
                                Version History
                              </Typography>
                            </div>
                          </Toolbar>
                          <Table bodyStyle={{ overflow: 'visible' }}>
                            <TableHead>
                              <TableRow>               
                              <TableCell>
                                  Version
                                </TableCell>                                
                                <TableCell>
                                  Creator
                                </TableCell>                                                
                                <TableCell>
                                  Created At
                                </TableCell>                                                                                                                              
                                <TableCell>
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                            {this.state.currentEnvVar.versions.map(function(envVar){
                              const isSelected = self.isSelected(envVar.id);

                              return (
                                <TableRow
                                hover 
                                selected={isSelected}
                                tabIndex={-1}
                                key={envVar.id}>
                                <TableCell>
                                  {envVar.version}
                                </TableCell>                              
                                <TableCell>
                                  {envVar.user.email}
                                </TableCell>
                                <TableCell>
                                  {envVar.created}
                                </TableCell>                                                                                
                                <TableCell>
                                  <Button color="primary">
                                    Rollback
                                  </Button>
                                </TableCell>
                              </TableRow>
                              )
                            })}                            
                            </TableBody>
                          </Table>
                        </Paper>
                      </Grid>
                    }
                  </Grid>    
                </div>
              </form>
            </div>
        </Drawer>            

        <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
          <DialogTitle>{"Are you sure you want to delete " + this.state.currentEnvVar.key + "?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {"This will delete the environment variable and all its versions associated with" + this.props.project.name + "."}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleDeleteEnvVar.bind(this)} color="accent">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>                                                                                                            
      </div>
    )
  }

}
