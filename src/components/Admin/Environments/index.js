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
        created
      }
    }
`)

@graphql(gql`
  mutation CreateEnvironment($name: String!) {
      createEnvironment(environment:{
      name: $name,
      }) {
          id
          name
      }
  }
`, { name: "createEnvironment" })

@graphql(gql`
mutation UpdateEnvironment($id: String!, $name: String!) {
    updateEnvironment(environment:{
    id: $id,
    name: $name,
    }) {
        id
        name
    }
}
`, { name: "updateEnvironment" })

@graphql(gql`
mutation DeleteEnvironment ($id: String!, $name: String!) {
    deleteEnvironment(environment:{
    id: $id,
    name: $name,
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
      'created',
    ];
    const rules = {
      'name': 'string|required',
    };
    const labels = {
      'name': 'Name',
    };
    const types = {
    };
    const keys = {
    };
    const disabled = {
      'name': false
    }
    const extra = {}
    const hooks = {};
    const plugins = { dvr: validatorjs };

    this.form = new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys }, { plugins });
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
      this.form.$('name').set(this.props.data.environments[envIdx].name)
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
        <div>
          Loading ...
        </div>
      )
    }

    var self = this;

    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <div>
              <Typography type="title">
                Environments
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
                      {new Date(env.created).toString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>

        <Button fab aria-label="Add" type="submit" raised color="primary"
            style={inlineStyles.addButton}
            onClick={this.openDrawer.bind(this)}>
            <AddIcon />
        </Button>

        <Drawer
            type="persistent"
            anchor="right"
            classes={{
            paper: styles.list,
            }}
            open={this.state.drawerOpen}
        >
            <div tabIndex={0} className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                  <Toolbar>
                  <Typography type="title" color="inherit">
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
                      <Button color="primary"
                        className={styles.buttonSpacing}
                        disabled={this.state.saving}
                        type="submit"
                        raised
                        onClick={(e) => this.onSubmit(e)}>
                          Save
                      </Button>
                      {this.form.$('id').value !== "" &&
                        <Button
                          disabled={this.state.saving}
                          color="accent"
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
            <Button onClick={()=>this.handleDelete()} color="accent">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }

}
