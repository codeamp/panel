import React from 'react';

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

import InputField from 'components/Form/input-field';

import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  }
}

@graphql(gql`
query {
  serviceSpecs {
    id
    name
    cpuRequest
    cpuLimit
    memoryRequest
    memoryLimit
    terminationGracePeriod
  }
}
`)

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
      drawerOpen: false,
      saving: false,
    }
  }

  componentWillMount(){
    const fields = [
      'name',
      'cpuRequest',
      'cpuLimit',
      'memoryRequest',
      'memoryLimit',
      'terminationGracePeriod',
      'id',
      'index',
    ];

    const rules = {
      'name': 'required|string',
      'cpuRequest': 'required|numeric',
      'cpuLimit': 'required|numeric',
      'memoryRequest': 'required|numeric',
      'memoryLimit': 'required|numeric',
      'terminationGracePeriod': 'required|string',
    };

    const labels = {
      'name': 'Name',
      'cpuRequest': 'CPU Request (millicpus)',
      'cpuLimit': 'CPU Limit (millicpus)',
      'memoryRequest': 'Memory Request (gb)',
      'memoryLimit': 'Memory Limit (gb)',
      'terminationGracePeriod': 'Termination Grace Period (seconds)',
    };

    const initials = {};

    const types = {};

    const extra = {};

    const hooks = {};

    const plugins = { dvr: validatorjs };

    this.form = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { plugins })
  }

  isSelected(id){
    return this.state.selected === id
  }
  handleClick(e, serviceSpec, index){
    this.form.$('name').set(serviceSpec.name);
    this.form.$('cpuRequest').set(serviceSpec.cpuRequest);
    this.form.$('cpuLimit').set(serviceSpec.cpuLimit);
    this.form.$('memoryRequest').set(serviceSpec.memoryRequest);
    this.form.$('memoryLimit').set(serviceSpec.memoryLimit);
    this.form.$('terminationGracePeriod').set(serviceSpec.terminationGracePeriod);
    this.form.$('id').set(serviceSpec.id);
    this.form.$('index').set(index);

    this.setState({ selected: serviceSpec.id, drawerOpen: true })
  }

  onSuccess(form){
    if(this.form.values()['id'] === ''){
      this.props.createServiceSpec({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
      });
    } else {
      this.props.updateServiceSpec({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch();
        this.closeDrawer()
      });
    }
  }

  handleDeleteServiceSpec() {
    this.props.deleteServiceSpec({
      variables: this.form.values(),
    }).then(({ data }) => {
      this.props.data.refetch()
      this.closeDrawer()
    });
  }

  openDrawer(){
    this.form.reset()
    this.form.showErrors(false)
    this.setState({ drawerOpen: true })
  }

  closeDrawer(){
    this.setState({ drawerOpen: false, dialogOpen: false })
  }

  onError(){
    // todo
  }

  onSubmit(e){
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  render() {
    const { loading, serviceSpecs } = this.props.data;

    if(loading){
      return (
        <div>
          Loading ...
        </div>
      )
    }

    return (
      <div className={styles.root}>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <Paper>
              <Toolbar>
                <div>
                  <Typography variant="title">
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
                      Memory Request (gb)
                    </TableCell>
                    <TableCell>
                      Memory Limit (gb)
                    </TableCell>
                    <TableCell>
                      Timeout (s)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serviceSpecs.map( (serviceSpec, index) => {
                    const isSelected = this.isSelected(serviceSpec.id);
                    return (
                      <TableRow
                        hover
                        onClick={event => this.handleClick(event, serviceSpec, index)}
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
        <Button variant="fab" aria-label="Add" type="submit" color="primary"
              style={inlineStyles.addButton}
              onClick={this.openDrawer.bind(this)}>
              <AddIcon />
        </Button>
        <Drawer
          anchor="right"
          classes={{
            paper: styles.drawer
          }}
          open={this.state.drawerOpen}
        >
            <div className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                <Toolbar>
                  <Typography variant="title" color="inherit">
                    Service Spec
                  </Typography>
                </Toolbar>
              </AppBar>
              <form onSubmit={(e) => e.preventDefault()}>
                <Grid container spacing={24} className={styles.grid}>
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      Requests and Limits are measured in megabytes.
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <InputField field={this.form.$('name')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={6}>
                    <InputField field={this.form.$('cpuRequest')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={6}>
                    <InputField field={this.form.$('cpuLimit')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={6}>
                    <InputField field={this.form.$('memoryRequest')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={6}>
                    <InputField field={this.form.$('memoryLimit')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={6}>
                    <InputField field={this.form.$('terminationGracePeriod')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button color="primary"
                        className={styles.buttonSpacing}
                        disabled={this.state.saving}
                        type="submit"
                        variant="raised"
                        onClick={this.onSubmit.bind(this)}>
                        Save
                    </Button>

                    {this.form.values()['id'] !== '' &&
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
              </form>
            </div>
        </Drawer>

        {serviceSpecs[this.form.values()['index']] != null &&
          <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
            <DialogTitle>{"Ae you sure you want to delete " + serviceSpecs[this.form.values()['index']].name + "?"}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                This will delete the service spec.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
                Cancel
              </Button>
              <Button onClick={this.handleDeleteServiceSpec.bind(this)} style={{ color: "red" }}>
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        }

      </div>
    );
  }
}
