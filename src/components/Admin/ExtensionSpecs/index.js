import React from 'react';

import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';

import AddIcon from 'material-ui-icons/Add';
import CloseIcon from 'material-ui-icons/Close';

import InputField from 'components/Form/input-field';
import SelectField from 'components/Form/select-field';

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
mutation CreateExtensionSpec ($name: String!, $type: String!, $formSpec: [KeyValueInput!]!, $component: String!) {
    createExtensionSpec(extensionSpec:{
    name: $name,
    type: $type,
    formSpec: $formSpec,
    component: $component,
    }) {
        id
        name
    }
}
`, { name: "createExtensionSpec" })


@graphql(gql`
mutation UpdateExtensionSpec ($id: String, $name: String!,  $type: String!, $formSpec: [KeyValueInput!]!, $component: String!) {
    updateExtensionSpec(extensionSpec:{
    id: $id,
    name: $name,
    type: $type,
    formSpec: $formSpec,
    component: $component,
    }) {
        id
        name
    }
}
`, { name: "updateExtensionSpec" })


@graphql(gql`
mutation DeleteExtensionSpec ($id: String, $name: String!, $type: String!, $formSpec: [KeyValueInput!]!, $component: String!) {
    deleteExtensionSpec(extensionSpec:{
    id: $id,
    name: $name,
    type: $type,
    formSpec: $formSpec,
    component: $component,
    }) {
        id
        name
    }
}
`, { name: "deleteExtensionSpec" })



@inject("store") @observer

export default class Extensions extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      selected: null,
      open: false,
      currentExtension: {
        id: -1,
      },
      drawerText: 'Create',
    }
  }

  componentDidMount(){
    this.props.socket.on("extensionSpecs/new", (data) => {
      console.log("extensions/new");
      console.log(data)
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        this.setState({ loading: false, drawerText: 'Create' })
        this.props.store.app.setSnackbar({msg: "Extension spec "+ data.name +" was created"})
      }, 2000);
    });

    this.props.socket.on("extensionSpecs/updated", (data) => {
      console.log("extensions/updated");
      console.log(data)
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        this.setState({ loading: false, drawerText: 'Update' })
        this.props.store.app.setSnackbar({msg: "Extension spec "+ data.name +" was updated."})
      }, 2000);
    });

    this.props.socket.on("extensionSpecs/deleted", (data) => {
      console.log("extensions/deleted");
      console.log(data)
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        this.setState({ loading: false })
        this.props.store.app.setSnackbar({msg: "Extension spec "+ data.name +" was deleted"})
      }, 2000);
    });


  }

  componentWillMount(){
    console.log(this.props);

    const fields = [
      'id',
      'name',
      'type',
      'formSpec',
      'formSpec[]',
      'formSpec[].key',
      'formSpec[].value',
      'component',
    ];

    const rules = {
      'name': 'required|string',
      'type': 'required',
      'formSpec[].key': 'required|string',
      'formSpec[].value': 'required|string',
      'component': 'required|string',
    };

    const labels = {
      'name': 'Name',
      'type': 'Type',
      'formSpec': "Form Specification",
      'formSpec[].key': 'Key',
      'formSpec[].value': 'Value',
      'component': 'Component Name',
    };

    const initials = {
      'type': 'Database'
    };

    const types = {
    };

    const extra = {
      'type': [{
        key: 'Database',
        value: 'Database',
      }, {
        key: 'Workflow',
        value: 'Workflow',
      }]
    };

    const hooks = {

    };

    const plugins = { dvr: validatorjs };

    this.extensionForm = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { plugins })
  }

  handleToggleDrawer(){
    console.log(this.state.open, this.extensionForm.values())
    if(this.state.open === true){
      this.extensionForm.reset()
    }
    console.log(this.extensionForm.values())

    this.setState({ open: !this.state.open, dialogOpen: false, currentExtension: { id: -1 } })
  }

  isSelected(id){
    return this.state.selected === id
  }
  handleClick(e, extension){
    this.extensionForm.$('id').set(extension.id)
    this.extensionForm.$('name').set(extension.name)
    this.extensionForm.update({ formSpec: extension.formSpec })
    this.extensionForm.$('component').set(extension.component)
    this.extensionForm.$('type').set(extension.type)

    console.log(extension.formSpec)
    console.log(this.extensionForm.$('formSpec').value)

    this.setState({ selected: extension.id, open: true, currentExtension: extension, drawerText: 'Update' })
  }

  handleNewExtensionClick(e){
    this.setState({ open: true, drawerText: 'Create' })
  }

  onSuccess(form){
    console.log('onSuccess')
    this.setState({ loading: true })
    var that = this
    switch(this.state.drawerText){
      case "Creating":
        this.props.createExtensionSpec({
          variables: form.values(),
        }).then(({data}) => {
          that.handleToggleDrawer()
        }).catch(error => {
          console.log(error)
        });
        break;
      case "Updating":
        this.props.updateExtensionSpec({
          variables: form.values(),
        }).then(({data}) => {
          console.log(data)
        }).catch(error => {
          console.log(error)
        });
        break;
    }
  }

  handleDeleteExtension() {
    console.log('handleDeleteExtension')
    this.setState({ loading: true })
    var that = this
    this.props.deleteExtensionSpec({
      variables: this.extensionForm.values(),
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
    this.extensionForm.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  render() {
    const { extensionSpecs } = this.props;

    console.log(extensionSpecs)


    let deleteButton = "";

    if(this.state.currentExtension.id !== -1){
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
                    Extension Specs
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
                      Type
                    </TableCell>
                    <TableCell>
                      Component
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {extensionSpecs.map(extension => {
                    const isSelected = this.isSelected(extension.id);
                    return (
                      <TableRow
                        hover
                        onClick={event => this.handleClick(event, extension)}
                        selected={isSelected}
                        tabIndex={-1}
                        key={extension.id}>
                        <TableCell> { extension.name} </TableCell>
                        <TableCell> { extension.type } </TableCell>
                        <TableCell> { extension.component } </TableCell>
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
              onClick={this.handleNewExtensionClick.bind(this)}>
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
                    {this.state.drawerText} Extension Spec
                  </Typography>
                </Toolbar>
              </AppBar>
              <form onSubmit={(e) => e.preventDefault()}>
                <Grid container spacing={24} className={styles.grid}>
                  <Grid item xs={12}>
                    <InputField field={this.extensionForm.$('name')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <SelectField field={this.extensionForm.$('type')} fullWidth={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <InputField field={this.extensionForm.$('component')} fullWith={true} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography type="subheading"> Form Specification Rules </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    {this.extensionForm.$('formSpec').map(function(kv){
                        console.log(kv)
                        return (
                        <Grid container spacing={24}>
                            <Grid item xs={4}>
                                <InputField field={kv.$('key')} fullWidth={false} className={styles.containerPortFormInput} />
                            </Grid>
                            <Grid item xs={5}>
                                <InputField field={kv.$('value')} fullWidth={false} className={styles.containerPortFormInput} />
                            </Grid>
                            <Grid item xs={1}>
                            <IconButton>
                                <CloseIcon onClick={kv.onDel} />
                            </IconButton>
                            </Grid>
                        </Grid>
                        )
                    })}
                    <Button raised color="secondary" onClick={this.extensionForm.$('formSpec').onAdd}>
                      Add rule
                    </Button>
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
                      color="accent"
                      onClick={this.handleToggleDrawer.bind(this)}>
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </div>
        </Drawer>

        <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
          <DialogTitle>{"Ae you sure you want to delete " + this.state.currentExtension.name + "?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will remove the service spec and all instances in which it is being used in any existing services.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleDeleteExtension.bind(this)} color="accent">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

      </div>
    );
  }
}
