import React from 'react';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
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

import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import styles from './style.module.css';

import { graphql, gql } from 'react-apollo';


const DEFAULT_EXTENSION = {
  id: -1,
  extensionSpec: {
    type: '',
  },
  formSpecValues: `{ "test": "1" }`
}

const DEFAULT_EXTENSION_SPEC = {
  id: -1,
}


@graphql(gql`
mutation CreateExtension ($projectId: String!, $extensionSpecId: String!, $formSpecValues: String!) {
    createExtension(extension:{ 
      projectId: $projectId,
      extensionSpecId: $extensionSpecId,
      formSpecValues: $formSpecValues,
    }) {
        id
    }
}
`, { name: "createExtension" })


export default class Extensions extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      addedExtensionsDrawer: {
        open: false,
        text: 'Edit',
        currentExtension: DEFAULT_EXTENSION,
      },
      availableExtensionsDrawer: {
        open: false,
        text: 'Add',
        currentExtensionSpec: DEFAULT_EXTENSION_SPEC,
      },
    }
  }

  isAddedExtensionSelected(id){
    return this.state.addedExtensionsDrawer.currentExtension.id === id;
  }

  isAvailableExtensionSelected(id){
    return this.state.availableExtensionsDrawer.currentExtensionSpec.id === id;
  }

  handleAddedExtensionClick(event, extension){
    let addedExtensionsDrawer = this.state.addedExtensionsDrawer
    addedExtensionsDrawer.currentExtension = extension
    addedExtensionsDrawer.open = true

    let availableExtensionsDrawer = this.state.availableExtensionsDrawer
    availableExtensionsDrawer.open = false

    this.setState({
      drawerText: 'Edit',
      addedExtensionsDrawer: addedExtensionsDrawer,
      availableExtensionsDrawer: availableExtensionsDrawer,
      currentExtension: extension 
    })
  }

  handleAvailableExtensionClick(event, extension){
    let availableExtensionsDrawer = this.state.availableExtensionsDrawer
    availableExtensionsDrawer.currentExtensionSpec = extension
    availableExtensionsDrawer.open = true

    let addedExtensionsDrawer = this.state.addedExtensionsDrawer
    addedExtensionsDrawer.open = false

    this.setState({
      drawerText: 'Add',
      addedExtensionsDrawer: addedExtensionsDrawer,
      availableExtensionsDrawer: availableExtensionsDrawer,
      currentExtension: extension,
    })
  }

  handleCloseAvailableExtensionsDrawer(){
    let availableExtensionsDrawer = this.state.availableExtensionsDrawer
    availableExtensionsDrawer.open = false

    this.setState({
      availableExtensionsDrawer: availableExtensionsDrawer
    })
  }

  handleDeleteExtension(extension){
    console.log('handleDeleteExtension', extension)
  }

  onSuccessAddExtension(form){
    console.log('onSuccessAddExtension')
    console.log(form)
    let stringFormValues = JSON.stringify(form.values())

    this.props.createExtension({
      variables: {
        'projectId': this.props.project.id,
        'extensionSpecId': this.state.availableExtensionsDrawer.currentExtensionSpec.id,
        'formSpecValues': stringFormValues,
      }
    }).then(({ data }) => {
      console.log(data)
    }).catch(error => {
      console.log(error)
    })
  }

  onErrorAddExtension(form){
    console.log('onErrorAddExtension')
    console.log(form)
  }

  handleAddExtension(extension, event){
    console.log('handleAddExtension', extension)
    if(this.availableExtensionsForm){
      this.availableExtensionsForm.onSubmit(event, { onSuccess: this.onSuccessAddExtension.bind(this), onError: this.onErrorAddExtension.bind(this) })
    }
  }

  renderFormSpecFromExtensionSpec(extensionSpec){
    console.log('renderFormSpecFromExtensionSpec', extensionSpec)

    let form = (
      <div>
      </div>
    );

    if(extensionSpec.id !== -1 ){
      let testExtension = JSON.parse(extensionSpec.formSpec)

      let plugins = {
        dvr: validatorjs,
      }

      let fields= testExtension['fields']
      let rules = testExtension['rules']
      let labels = testExtension['labels']

      console.log(rules)

      this.availableExtensionsForm = new MobxReactForm({ fields, rules, labels, plugins })

      console.log(this.availableExtensionsForm)
      var self = this;
      form = (
        <div>
          <form>
            <Typography>
              {testExtension.fields.map(function(field){
                console.log(field)
                if(field !== 'projectId' && field !== 'extensionSpecId'){
                   return (
                     <InputField field={self.availableExtensionsForm.$(field)} />
                   )
                }
								return (<div></div>)
              })}
            </Typography>
          </form>
        </div>
      )
    }

    return form
  }

  renderFormSpecValues(extension){
		console.log(extension)
		let formSpecValues = JSON.parse(extension.formSpecValues)
		console.log(formSpecValues)
		formSpecValues = JSON.stringify(formSpecValues, null, 2)
		return (
			<Typography type="body2">
				{formSpecValues}
			</Typography>
		)
  }


  render() {
    const { project, extensionSpecs } = this.props;

    let addedExtensionsDeleteButton = "";

    if(this.state.addedExtensionsDrawer.currentExtension.id !== -1){
      addedExtensionsDeleteButton = (
        <Button
          disabled={this.state.loading}
          color="accent"
          onClick={()=>this.setState({ dialogOpen: true })}>
          Delete
        </Button>
      );
    }

    return (
      <div>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <Paper>
              <Toolbar>
                <div>
                  <Typography type="title">
                    Added Extensions
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
                      Added
                    </TableCell>
                    <TableCell>
                      State
                    </TableCell>
                    <TableCell>
                      Artifacts
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.extensions.map(extension => {
                    const isSelected = this.isAddedExtensionSelected(extension.id);
                    return (
                      <TableRow 
                        hover
                        onClick={event => this.handleAddedExtensionClick(event, extension)}
                        selected={isSelected}
                        tabIndex={-1}
                        key={extension.id}>
                        <TableCell> { extension.extensionSpec.name } </TableCell>
                        <TableCell> { new Date(extension.created).toDateString() }</TableCell>
                        <TableCell> { extension.state } </TableCell>
                        <TableCell> { extension.artifacts }</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper>
              <Toolbar>
                <div>
                  <Typography type="title">
                    Available Extensions
                  </Typography>
                </div>
              </Toolbar>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Name
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {extensionSpecs.map(extensionSpec => {
                    let ignore = false

                    // check if this is already in added extensions
                    const addedExtensions = project.extensions.map(function(extension){
                      return extension.extensionSpec.name
                    })

                    if(addedExtensions.includes(extensionSpec.name)){
                      ignore = true
                    }

                    if(!ignore){
                      const isSelected = this.isAvailableExtensionSelected(extensionSpec.id);
                      return (
                        <TableRow 
                          hover
                          onClick={event => this.handleAvailableExtensionClick(event, extensionSpec)}
                          selected={isSelected}
                          tabIndex={-1}
                          key={extensionSpec.id}>
                          <TableCell> { extensionSpec.name } </TableCell>
                        </TableRow>
                      )
                    } else {
                      return (
                        <div></div>
                      )
                    }
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>

        <Drawer
          type="persistent"
          anchor="right"
          classes={{
            paper: styles.drawer
          }}
          open={this.state.addedExtensionsDrawer.open}
        >
            <div className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                <Toolbar>
                  <Typography type="title" color="inherit">
                    {this.state.addedExtensionsDrawer.text} Extension
                  </Typography>
                </Toolbar>
              </AppBar>
              <div className={styles.drawerBody}>
                <Grid container spacing={24}>
                  <Grid item xs={12}>
                    <Typography>
                      Type: { this.state.addedExtensionsDrawer.currentExtension.extensionSpec.type}
                    </Typography>
                  </Grid>
									<Grid>
										{this.renderFormSpecValues(this.state.addedExtensionsDrawer.currentExtension)}
									</Grid>
									<Grid item xs={12}>
										<Button color="accent" raised className={styles.rightPad}>
											Disable
										</Button>
										{ addedExtensionsDeleteButton }
                    <Button color="primary">
                      Cancel
                    </Button>
									</Grid>
                </Grid>
              </div>
            </div>
        </Drawer>

      <Drawer
          type="persistent"
          anchor="right"
          classes={{
            paper: styles.drawer
          }}
          open={this.state.availableExtensionsDrawer.open}
        >
            <div className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                <Toolbar>
                  <Typography type="title" color="inherit">
                    {this.state.availableExtensionsDrawer.text} Extension
                  </Typography>
                </Toolbar>
              </AppBar>
              <div className={styles.drawerBody}>
                <Grid container spacing={24}>
                  <Grid item xs={12}>
                    <Typography type="subheading">
                      { this.state.availableExtensionsDrawer.currentExtensionSpec.name }
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography type="body2">
                      Type: { this.state.availableExtensionsDrawer.currentExtensionSpec.type }
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    {this.renderFormSpecFromExtensionSpec(this.state.availableExtensionsDrawer.currentExtensionSpec)}
                  </Grid>
                  <Grid item xs={12}>
                    <Button raised color="primary" className={styles.rightPad}
                      onClick={(event) => this.handleAddExtension(this.state.availableExtensionsDrawer.currentExtensionSpec, event)}
                    >
                      add
                    </Button>
                    <Button color="primary"
                      onClick={this.handleCloseAvailableExtensionsDrawer.bind(this)}
                    >
                      cancel
                    </Button>
                  </Grid>
                </Grid>
              </div>
            </div>
        </Drawer>


        <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
          <DialogTitle>{"Ae you sure you want to delete " + this.state.addedExtensionsDrawer.currentExtension.extensionSpec.name + "?"}</DialogTitle>
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
    )
  }
}
