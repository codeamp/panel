import React from 'react';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import { CircularProgress } from 'material-ui/Progress';

import ExtensionStateCompleteIcon from 'material-ui-icons/CheckCircle';

import { graphql, gql } from 'react-apollo';

import styles from './style.module.css';
import DockerBuilder from './DockerBuilder';

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
mutation CreateExtension ($projectId: String!, $extensionSpecId: String!, $formSpecValues: [KeyValueInput!]!) {
    createExtension(extension:{
      projectId: $projectId,
      extensionSpecId: $extensionSpecId,
      formSpecValues: $formSpecValues,
    }) {
        id
    }
}
`, { name: "createExtension" })

@graphql(gql`
mutation UpdateExtension ($id: String, $projectId: String!, $extensionSpecId: String!, $formSpecValues: [KeyValueInput!]!) {
    updateExtension(extension:{
      id: $id,
      projectId: $projectId,
      extensionSpecId: $extensionSpecId,
      formSpecValues: $formSpecValues,
    }) {
        id
    }
}
`, { name: "updateExtension" })




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

  handleCloseAddedExtensionsDrawer(){
    let addedExtensionsDrawer = this.state.addedExtensionsDrawer
    addedExtensionsDrawer.open = false

    this.setState({
      addedExtensionsDrawer: addedExtensionsDrawer
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

  renderFormSpecFromExtensionSpec(extensionSpec){
    console.log('renderFormSpecFromExtensionSpec', extensionSpec)
		let form = (<div></div>)

		switch(extensionSpec.component){
		case "DockerBuilderView":
			form = (<DockerBuilder
								project={this.props.project}
								extensionSpec={extensionSpec}
                                createExtension={this.props.createExtension}
								handleClose={this.handleCloseAvailableExtensionsDrawer.bind(this)}
								viewType="edit" />)
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

  renderAddedExtensionView(extension){
      console.log(extension)
      let view = (<div></div>);

      if(extension.id !== -1){
          view = (
            <DockerBuilder
                project={this.props.project}
                extensionSpec={extension.extensionSpec}
                extension={extension}
                updateExtension={this.props.updateExtension}
                handleClose={this.handleCloseAddedExtensionsDrawer.bind(this)}
                viewType="read" />)
      }
      return view
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.extensions.map(extension => {
                    const isSelected = this.isAddedExtensionSelected(extension.id);
                    let stateIcon = <CircularProgress size={25} />
                    if(extension.state === "complete"){
                        stateIcon = <ExtensionStateCompleteIcon />
                    }

                    return (
                      <TableRow
                        hover
                        onClick={event => this.handleAddedExtensionClick(event, extension)}
                        selected={isSelected}
                        tabIndex={-1}
                        key={extension.id}>
                        <TableCell> { extension.extensionSpec.name } </TableCell>
                        <TableCell> { new Date(extension.created).toDateString() }</TableCell>
                        <TableCell> { stateIcon } </TableCell>
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
                  <Grid item xs={12}>
                    {this.renderAddedExtensionView(this.state.addedExtensionsDrawer.currentExtension)}
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
                </Grid>
              </div>
            </div>
        </Drawer>
      </div>
    )
  }
}
