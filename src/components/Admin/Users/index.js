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
import Loading from 'components/Utils/Loading';
import styles from './style.module.css';
import { observer } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

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
mutation UpdateUserPermissions($userID: String!, $permissions: [UserPermissionInput!]!) {
    updateUserPermissions(userPermissions:{
      userID: $userID,
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
      'permissions[].value',
      'permissions[].grant',
    ];
    const rules = {
      'email': 'string|required',
    };
    const labels = {
      'email': 'Email',
    };
    const types = {
      'permissions[].grant': 'checkbox',
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
      let userPermissions = this.props.data.users[envIdx].permissions
      let permissions = this.props.data.permissions
      var self = this
      Object.keys(permissions).map(function(permission){
        if(userPermissions.includes(permission)){
            self.form.$('permissions').add({ "value": permission, "grant": true })
        } else {
            self.form.$('permissions').add({ "value": permission, "grant": false })
        }
        return true
      })
      this.form.$('id').set(this.props.data.users[envIdx].id)
      this.openDrawer()
    }
  }

  onSuccess(form){
    this.props.updateUserPermissions({
      variables: { userID: form.$('id').value, permissions: form.$('permissions').value },
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

  render() {
    const { loading, users } = this.props.data;

    if(loading){
      return (
        <Loading />
      )
    }

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
                      {env.permissions.length}
                    </TableCell>
                    <TableCell>
                      {new Date(env.created).toDateString()}
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
                      User
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
                              <CheckboxField field={permission.$('grant')} label={permission.value["value"]} fullWidth={true} />
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
