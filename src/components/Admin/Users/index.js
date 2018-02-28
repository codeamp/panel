import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import InputField from 'components/Form/input-field';
import CheckboxField from 'components/Form/checkbox-field';
import styles from './style.module.css';
import { observer } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
  }
}

@graphql(gql`
  query {
    users {
      id
      email
      permissions
      created
    }
    permissions
  }
`)

@graphql(gql`
mutation UpdateUserPermissions($userId: String!, $permissions:[Json!]!) {
    updateUserPermissions(userPermissions:{
      userId: $userId,
      permissions: $permissions,
    })
}
`, { name: "updateUserPermissions" })


@observer
export default class Users extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      saving: false,
      drawerOpen: false,
      dialogOpen: false,
      currentUserPermissionsMap: {},
    }
  }

  createUsersForm(){
    const fields = [
      'id',
      'email',
      'created',
      'permissions',
      'permissions[].permission',
      'permissions[].checked',
    ];
    const rules = {
      'email': 'string|required',
    };
    const labels = {
      'email': 'Email',
    };
    const types = {
      'permissions[].checked': 'checkbox',
    };
    const keys = {};
    const disabled = {
      'name': false,
    }
    const initials = {
      'permissions': [],
    }    
    const defaults = {
      'permissions': [],
    }
    const extra = {}
    const hooks = {};
    const plugins = { dvr: validatorjs };

    this.form = new MobxReactForm({ fields, rules, disabled, labels, initials, defaults, extra, hooks, types, keys }, { plugins });    
  }

  componentWillMount(){
    this.createUsersForm()
  }

  onSubmit(e) {
    this.setState({ saving: true })
    this.onSuccess(this.form)
  }

  onClick(envIdx){
    this.createUsersForm()
    if(envIdx >= 0){
      this.form.$('email').set(this.props.data.users[envIdx].email)
      this.form.$('email').set('disabled', true)
      // Create permissions map
      // permission -> does user have this permission checked?
      this.createPermissionsMap(this.props.data.permissions, this.props.data.users[envIdx].permissions)
      this.form.$('id').set(this.props.data.users[envIdx].id)
      this.openDrawer()
    }
  }

  onSuccess(form){
    console.log('onSuccess', form.values())
    console.log(form.$('id').value, form.$('permissions').value)
    this.props.updateUserPermissions({
      variables: { userId: form.$('id').value, permissions: form.$('permissions').value },
    }).then(({data}) => {
      this.props.data.refetch()
      this.closeDrawer()
    });
  }

  openDrawer(){
    this.setState({ drawerOpen: true, saving: false });
  }

  closeDrawer(){
    this.form = null
    this.setState({ drawerOpen: false, saving: false, dialogOpen: false })
  }

  handleDelete(){
    console.log('handleDelete')
  }

  // This creates a map of all available permissions
  // for the user to checkbox for a given user and checks
  // any permissions that the given user already has
  createPermissionsMap(permissions, userPermissions) {
    let permissionsMap = {}
    let checked = false
    var self = this
    permissions.map(function(permission){
      console.log(permission)
      // insert into form fields with user permission value 
      checked = false
      if(userPermissions.includes(permission)){
        checked = true
      }
      self.form.$('permissions').add({ "permission": permission, "checked": checked})
    })
  }

  render() {
    const { loading, users, permissions } = this.props.data;
    if(loading){
      return (
        <div>
          Loading ...
        </div>
      )
    }

    console.log(users)

    var self = this;
    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <div>
              <Typography variant="title">
                Users
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
                  Permissions
                </TableCell>
                <TableCell>
                  Created
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(function(env, idx){
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    onClick={()=> self.onClick(idx)}
                    key={env.id}>
                    <TableCell>
                      {env.email}
                    </TableCell>
                    <TableCell>
                      {env.permissions.slice(1)}
                    </TableCell>
                    <TableCell>
                      {new Date(env.created).toString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>

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
                      Environment
                  </Typography>
                  </Toolbar>
              </AppBar>
              <form>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24} className={styles.grid}>
                    {this.form && 
                      <Grid item xs={12}>
                        <Grid item xs={12}>
                          <InputField field={this.form.$('email')} fullWidth={true} />
                        </Grid>
                        {this.form.$('permissions').map(function(permission){
                          return (
                            <Grid item xs={12}>
                              <CheckboxField field={permission.$('checked')} label={permission.value["permission"]} fullWidth={true} />
                            </Grid>                        
                          )
                        })}
                      </Grid>
                    }
                    <Grid item xs={12}>
                      <Button color="primary"
                        className={styles.buttonSpacing}
                        disabled={this.state.saving}
                        type="submit"
                        variant="raised"
                        onClick={(e) => this.onSubmit(e)}>
                          Save
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
        {this.form &&
          <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
            <DialogTitle>{"Are you sure you want to delete " + this.form.values()['name'] + "?"}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {"This will delete the environment " + this.form.values()['name'] + "."}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>this.setState({ dialogOpen: false })} color="primary">
                Cancel
              </Button>
              <Button onClick={()=>this.handleDelete()} color="accent">
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        }
      </div>
    )
  }

}
