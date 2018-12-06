import React from 'react';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Drawer from 'material-ui/Drawer';
import TextField from 'material-ui/TextField';
import AppBar from 'material-ui/AppBar';
import Card from 'material-ui/Card';
import Toolbar from 'material-ui/Toolbar';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Button from 'material-ui/Button';
import Link from 'react-router-dom/Link';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import AddIcon from '@material-ui/icons/Add';
import DefaultIcon from '@material-ui/icons/Done';
import Loading from 'components/Utils/Loading';
import ServiceSpecForm from 'components/Utils/ServiceSpecForm';
import { observer, inject } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import styles from './style.module.css';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const inlineStyles = {
  addButton: {
    position: 'fixed',
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
    isDefault
    service {
      id
      project {
        id
        slug
      }
      suggestedServiceSpec {
        id
        cpuRequest
        cpuLimit
        memoryRequest
        memoryLimit
      }
      environment {
        id
        key
      }
    }
  }
}
`,{
  options: {
    fetchPolicy: 'cache-and-network'
  }
})

@graphql(gql`
mutation CreateServiceSpec ($name: String!, $cpuRequest: String!, $cpuLimit: String!,
  $memoryRequest: String!, $memoryLimit: String!, $terminationGracePeriod: String!, $isDefault: Boolean!) {
    createServiceSpec(serviceSpec:{
    name: $name,
    cpuRequest: $cpuRequest,
    cpuLimit: $cpuLimit,
    memoryRequest: $memoryRequest,
    memoryLimit: $memoryLimit,
    terminationGracePeriod: $terminationGracePeriod,
    isDefault: $isDefault,
    }) {
        id
        name
    }
}
`, { name: "createServiceSpec" })

@graphql(gql`
mutation DeleteServiceSpec ($id: String!, $name: String!, $cpuRequest: String!, $cpuLimit: String!,
  $memoryRequest: String!, $memoryLimit: String!, $terminationGracePeriod: String!, $isDefault: Boolean!) {
    deleteServiceSpec(serviceSpec:{
    id: $id,
    name: $name,
    cpuRequest: $cpuRequest,
    cpuLimit: $cpuLimit,
    memoryRequest: $memoryRequest,
    memoryLimit: $memoryLimit,
    terminationGracePeriod: $terminationGracePeriod,
    isDefault: $isDefault,
    }) {
        id
        name
    }
}
`, { name: "deleteServiceSpec" })

@graphql(gql`
mutation UpdateServiceSpec ($id: String!, $name: String!, $cpuRequest: String!, $cpuLimit: String!,
  $memoryRequest: String!, $memoryLimit: String!, $terminationGracePeriod: String!, $isDefault: Boolean!) {
    updateServiceSpec(serviceSpec:{
    id: $id,
    name: $name,
    cpuRequest: $cpuRequest,
    cpuLimit: $cpuLimit,
    memoryRequest: $memoryRequest,
    memoryLimit: $memoryLimit,
    terminationGracePeriod: $terminationGracePeriod,
    isDefault: $isDefault,
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
      dirtyFormDialogOpen: false,
      currentServiceSpec: {},
      serviceSpecFormValues: {},
      dialogOpen: false,
    }

    this.form = this.initServiceSpecsForm()
  }

  isSelected(id){
    return this.state.selected === id
  }

  handleClick(e, serviceSpec, index){
    this.form = this.initServiceSpecsForm(serviceSpec)
    this.setState({ currentServiceSpec: serviceSpec, selected: serviceSpec.id, drawerOpen: true })
  }

  onError(){
    // todo
  }

  onSubmit(e){
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  onSuccess(form){
    if(this.form.values()['id'] === ''){
      this.props.create(form.values())
    } else {
      this.props.update(form.values())
    }
  }  

  initServiceSpecsForm(formInitials = {}) {
    const fields = [
      'name',
      'cpuRequest',
      'cpuLimit',
      'memoryRequest',
      'memoryLimit',
      'terminationGracePeriod',
      'id',
      'isDefault',
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
      'memoryRequest': 'Memory Request (mb)',
      'memoryLimit': 'Memory Limit (mb)',
      'terminationGracePeriod': 'Timeout (seconds)',
      'isDefault': 'Default profile that will be applied to new services.',
    };
    const initials = formInitials;
    const types = {
      'isDefault': 'checkbox',
    };
    const extra = {};
    const hooks = {};
    const plugins = { dvr: validatorjs };

    return new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { plugins })
  }      

  onSuccess(form){
    if(this.form.values()['id'] === ''){
      this.props.createServiceSpec({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.props.store.app.setSnackbar({
          msg: form.values()['name'] + " has been created",
          open: true,
        })
        this.closeDrawer(true)
      });
    } else {
      this.props.updateServiceSpec({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch();
        this.props.store.app.setSnackbar({
          msg: form.values()['name'] + " has been updated",
          open: true,
        })
        this.closeDrawer(true)
      });
    }
  }

  openDrawer(){
    this.form = this.initServiceSpecsForm()
    this.setState({ drawerOpen: true })
  }

  closeDrawer(force = false){
    if(!force){
      this.setState({ dirtyFormDialogOpen: true })
    } else {
      this.setState({ drawerOpen: false, dirtyFormDialogOpen: false, dialogOpen: false })
    }
  }

  handleUpdateServiceSpec(requestPayload = {}) {
    this.props.updateServiceSpec({
      variables: requestPayload,
    }).then(({data}) => {
      this.props.data.refetch();
      this.props.store.app.setSnackbar({
        msg: requestPayload['name'] + " has been updated",
        open: true,
      })
      this.closeDrawer(true)
    });
  }

  handleCreateServiceSpec(requestPayload = {}) {
    this.props.createServiceSpec({
      variables: requestPayload,
    }).then(({data}) => {
      this.props.data.refetch()
      this.props.store.app.setSnackbar({
        msg: requestPayload['name'] + " has been created",
        open: true,
      })
      this.closeDrawer(true)
    });
}

  handleDeleteServiceSpec(requestPayload = {}) {
    this.setState({ dialogOpen: true, serviceSpecFormValues: requestPayload })
  }

  confirmDeleteServiceSpec(){
    if(!!this.state.currentServiceSpec){
      this.props.deleteServiceSpec({
        variables: this.state.currentServiceSpec,
      }).then(({ data }) => {
        this.props.data.refetch()
        this.closeDrawer(true)
      });
    }
  }

  render() {
    const { loading, serviceSpecs } = this.props.data;

    if(loading){
      return (
        <Loading />
      );
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
                      Memory Request (mb)
                    </TableCell>
                    <TableCell>
                      Memory Limit (mb)
                    </TableCell>
                    <TableCell>
                      Timeout (s)
                    </TableCell>
                    <TableCell>
                      Default
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
                        <TableCell> { serviceSpec.name } </TableCell>
                        <TableCell> { serviceSpec.cpuRequest}</TableCell>
                        <TableCell> { serviceSpec.cpuLimit } </TableCell>
                        <TableCell> { serviceSpec.memoryRequest }</TableCell>
                        <TableCell> { serviceSpec.memoryLimit }</TableCell>
                        <TableCell> { serviceSpec.terminationGracePeriod }</TableCell>
                        <TableCell> { serviceSpec.isDefault ? <DefaultIcon /> : "" }</TableCell>
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
          onClose={() => {this.closeDrawer()}}
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
              <div>
                <ServiceSpecForm 
                  delete={this.handleDeleteServiceSpec.bind(this)} 
                  create={this.handleCreateServiceSpec.bind(this)}
                  update={this.handleUpdateServiceSpec.bind(this)}
                  form={this.form}
                  serviceSpec={this.state.currentServiceSpec}
                  cancel={this.closeDrawer.bind(this)} />
                {!!this.state.currentServiceSpec.service &&
                  <Grid container spacing={24} className={styles.grid}>
                    <Grid item xs={12}>
                      <Link to={"/projects/" + this.state.currentServiceSpec.service.project.slug + "/" + this.state.currentServiceSpec.service.environment.key + "/services?serviceID=" + this.state.currentServiceSpec.service.id}>
                        <Typography variant="body2">Edit Service</Typography>
                      </Link>
                    </Grid>
                    <Grid item xs={12}>
                      <Card style={{ padding: 25 }}>
                        <Typography variant="title" style={{ marginBottom: 15 }}>Suggested Resource Specification</Typography>
                        <Grid container spacing={24}>
                          <Grid item xs={12}>
                            <Typography variant="subheading">CPU</Typography>
                            <Typography variant="body2">(millicpus)</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField value={this.state.currentServiceSpec.service.suggestedServiceSpec.cpuRequest} label={"Request"} disabled/>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField value={this.state.currentServiceSpec.service.suggestedServiceSpec.cpuLimit} label={"Limit"} disabled />
                          </Grid>
                        </Grid>
                        <br/>
                        {/* <Divider style={{ marginTop: 15, marginBottom: 15 }}/> */}
                        <Grid container spacing={24}>
                          <Grid item xs={12}>
                            <Typography variant="subheading">Memory</Typography>
                            <Typography variant="body2">(mb)</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField value={this.state.currentServiceSpec.service.suggestedServiceSpec.memoryRequest} label={"Request"} disabled/>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField value={this.state.currentServiceSpec.service.suggestedServiceSpec.memoryLimit} label={"Limit"} disabled />
                          </Grid>
                        </Grid>
                      </Card>
                      </Grid>
                    </Grid>
                  }
                </div>
            </div>
        </Drawer>

        {!!this.state.currentServiceSpec.id &&
          <Dialog open={this.state.dialogOpen}>
            <DialogTitle>
              {"Ae you sure you want to delete " + this.state.currentServiceSpec.name + "?"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                This will delete the service spec.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => this.setState({ dialogOpen: false })} color="primary">
                Cancel
              </Button>
              <Button onClick={this.confirmDeleteServiceSpec.bind(this)} style={{ color: "red" }}>
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        }

      </div>
    );
  }
}
