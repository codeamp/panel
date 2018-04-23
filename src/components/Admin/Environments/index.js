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
import AddIcon from 'material-ui-icons/Add';
import InputField from 'components/Form/input-field';
import CheckboxField from 'components/Form/checkbox-field';
import Loading from 'components/Utils/Loading';
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
      environments {
        id
        name
        key
        color
        isDefault
        created
      }
    }
`)

@graphql(gql`
  mutation CreateEnvironment($name: String!, $key: String!,$isDefault: Boolean!, $color: String!) {
      createEnvironment(environment:{
        name: $name,
        key: $key,
        isDefault: $isDefault,
        color: $color,
      }) {
          id
          name
      }
  }
`, { name: "createEnvironment" })

@graphql(gql`
mutation UpdateEnvironment($id: String!, $name: String!, $key: String!, $isDefault: Boolean!, $color: String!) {
    updateEnvironment(environment:{
    id: $id,
    name: $name,
    key: $key,
    isDefault: $isDefault,
    color: $color,
    }) {
        id
        name
    }
}
`, { name: "updateEnvironment" })

@graphql(gql`
mutation DeleteEnvironment ($id: String!, $name: String!, $key: String!, $isDefault: Boolean!, $color: String!) {
    deleteEnvironment(environment:{
    id: $id,
    name: $name,
    key: $key,
    isDefault: $isDefault,
    color: $color,
    }) {
        id
        name
    }
}
`, { name: "deleteEnvironment" })

@observer
export default class Environments extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      saving: false,
      drawerOpen: false,
      dialogOpen: false,
    }
  }

  componentWillMount(){
    const initials = {}
    const fields = [
      'id',
      'name',
      'color',
      'key',
      'isDefault',
      'created',
    ];
    const rules = {
      'name': 'string|required',
    };
    const labels = {
      'name': 'Name',
      'color': 'Color',
      'key': 'Key',
      'isDefault': 'Should this be a default?',
    };
    const types = {
      'isDefault': 'checkbox',
    };
    const keys = {
    };
    const disabled = {
      'name': false,
      'color': false,
      'key': false,
    }
    const extra = {}
    const hooks = {};
    const placeholders = {
      'isDefault': 'Default envs are auto-added to a project on creation. Atleast 1 default is required at any time.',
    };
    const plugins = { dvr: validatorjs };

    this.form = new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys, placeholders }, { plugins });
  }

  onSubmit(e) {
    this.setState({ saving: true })
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  onError(form){
    this.setState({ saving: false })
  }

  onClick(envIdx){

    this.form.clear()

    if(envIdx >= 0){
      this.form.$('key').set('disabled', true)
      this.form.$('key').set(this.props.data.environments[envIdx].key)
      this.form.$('name').set(this.props.data.environments[envIdx].name)
      this.form.$('isDefault').set(this.props.data.environments[envIdx].isDefault)
      this.form.$('color').set(this.props.data.environments[envIdx].color)
      this.form.$('id').set(this.props.data.environments[envIdx].id)
      this.openDrawer()
    }
  }

  onSuccess(form){
    if(form.values()['id'] !== ""){
      this.props.updateEnvironment({
        variables: form.values(),
      }).then(({data}) => {
        this.closeDrawer()
        this.props.data.refetch()
      });
    } else {
      this.props.createEnvironment({
        variables: form.values(),
      }).then(({data}) => {
        this.closeDrawer()
        this.props.data.refetch()
      });
    }
  }

  openDrawer(){
    this.setState({ drawerOpen: true, saving: false });
  }

  closeDrawer(){
    this.form.clear()
    this.form.$('key').set('disabled', false)
    this.setState({ drawerOpen: false, saving: false, dialogOpen: false })
  }

  handleDelete(){
    this.props.deleteEnvironment({
      variables: this.form.values(),
    }).then(({data}) => {
      this.props.data.refetch()
      this.closeDrawer()
    });
  }

  render() {
    const { loading, environments } = this.props.data;
    if(loading){
      return (
        <Loading />
      );
    }

    var self = this;

    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <Typography variant="title">
              Environments
            </Typography>
          </Toolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Name
                </TableCell>
                <TableCell>
                  Color
                </TableCell>
                <TableCell>
                  Default
                </TableCell>
                <TableCell>
                  Created
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {environments.map(function(env, idx){
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    onClick={()=> self.onClick(idx)}
                    key={env.id}>
                    <TableCell>
                      {env.name}
                    </TableCell>
                    <TableCell>
                        <svg height="10" width="10">
                          <circle cx="25" cy="25" r="40" fill={env.color} />
                        </svg>
                    </TableCell>
                    <TableCell>
                      {env.isDefault.toString()}
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

        <Button variant="fab" aria-label="Add" type="submit" color="primary"
            style={inlineStyles.addButton}
            onClick={this.openDrawer.bind(this)}>
            <AddIcon />
        </Button>

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
                    <Grid item xs={12}>
                      <InputField field={this.form.$('name')} fullWidth={true} />
                    </Grid>
                    <Grid item xs={12}>
                      <InputField field={this.form.$('key')} fullWidth={true} />
                    </Grid>
                    <Grid item xs={12}>
                      <CheckboxField field={this.form.$('isDefault')} fullWidth={true} />
                      <Typography variant="caption"> {this.form.$('isDefault').placeholder} </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <InputField field={this.form.$('color')} fullWidth={true} />
                    </Grid>
                    <Grid item xs={12}>
                      <Button color="primary"
                        className={styles.buttonSpacing}
                        disabled={this.state.saving}
                        type="submit"
                        variant="raised"
                        onClick={(e) => this.onSubmit(e)}>
                          Save
                      </Button>
                      {this.form.$('id').value !== "" &&
                        <Button
                          disabled={this.state.saving}
                          style={{ color: "red" }}
                          onClick={()=>this.setState({ dialogOpen: true })}>
                          Delete
                        </Button>
                      }
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
            <Button onClick={()=>this.handleDelete()} style={{ color: "red" }}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }

}
