import React from 'react';
import Card, { CardActions, CardContent } from 'material-ui/Card';
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

import styles from './style.module.css';

const DEFAULT_EXTENSION = {
  id: -1,
  extensionSpec: {
    type: '',
  }
}

const DEFAULT_EXTENSION_SPEC = {
  id: -1,
}

export default class Extensions extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      addedExtensionsDrawer: {
        open: false,
        text: 'Add',
        currentExtension: DEFAULT_EXTENSION,
      },
      availableExtensionsDrawer: {
        open: false,
        text: 'Edit',
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

  handleDeleteExtension(extension){
    console.log('handleDeleteExtension', extension)
  }

  render() {
    const { project, extensionSpecs } = this.props;

    let addedExtensionsDeleteButton = "";
    let availableExtensionsDeleteButton = "";

    if(this.state.addedExtensionsDrawer.currentExtension.id !== -1){
      addedExtensionsDeleteButton = (
        <Button>
          disabled={this.state.loading}
          color="accent"
          onClick={()=>this.setState({ dialogOpen: true })}>
          Delete
        </Button>
      );
    }

    if(this.state.availableExtensionsDrawer.currentExtensionSpec.id !== -1){
      addedExtensionsDeleteButton = (
        <Button>
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
                    <TableCell>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {extensionSpecs.map(extensionSpec => {
                    const isSelected = this.isAvailableExtensionSelected(extensionSpec.id);
                    return (
                      <TableRow 
                        hover
                        onClick={event => this.handleAvailableExtensionClick(event, extensionSpec)}
                        selected={isSelected}
                        tabIndex={-1}
                        key={extensionSpec.id}>
                        <TableCell> { extensionSpec.name } </TableCell>
                        <TableCell>
                          <Button color="primary">
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
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
              <Grid container spacing={24}>
                <Grid item xs={12}>
                  <Typography>
                    Type: { this.state.addedExtensionsDrawer.currentExtension.extensionSpec.type}
                  </Typography>
                </Grid>
              </Grid>
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
              <Grid container spacing={24}>
                <Grid item xs={12}>
                  <Typography>
                    Type: { this.state.availableExtensionsDrawer.currentExtensionSpec.type}
                  </Typography>
                </Grid>
              </Grid>
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
