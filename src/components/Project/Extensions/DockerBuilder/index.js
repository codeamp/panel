import React from 'react';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Paper from 'material-ui/Paper';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import Input from 'material-ui/Input';

import InputField from 'components/Form/input-field';

import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';

import styles from './style.module.css';

const DEFAULT_EXTENSION = {
    id: -1,
    artifacts: [],
}

const DEFAULT_EXTENSION_SPEC = {
    id: -1,
}

export default class DockerBuilder extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      dialogOpen: false,
      addButtonDisabled: false,
      buttonText: 'Add',
      extension: DEFAULT_EXTENSION,
      extensionSpec: DEFAULT_EXTENSION_SPEC,
    }
  }

  componentWillMount(){
    this.setupForm()
  }

  componentWillReceiveProps(nextProps){
    console.log(nextProps)
  }

  setupForm(){
    const fields = [
      'hostname',
      'credentials',
    ];

    const rules = {
      'hostname': 'required|string',
      'credentials': 'required|string',
    };

    const labels = {
      'hostname': 'Registry URL',
      'credentials': 'Credentials',
    };

    const initials = {};
    const types = {};
    const extra = {}
    const hooks = {};
    const plugins = { dvr: validatorjs };

    this.form = new MobxReactForm({ fields, rules, labels, initials, types, extra, hooks, plugins })


    // reflect viewType in state props
    if(this.props.viewType === "read"){
        console.log(this.props.extension)
        let obj = {}
        this.props.extension.formSpecValues.map(function(kv) {
            obj[kv['key']] = kv.value
        })


        this.form.$('hostname').set(obj['hostname'])
        this.form.$('credentials').set(obj['credentials'])

        this.setState({ buttonText: "Update", extension: this.props.extension, extensionSpec: this.props.extensionSpec })
    } else if(this.props.viewType === "edit"){
        this.setState({ buttonText: "Add", extensionSpec: this.props.extensionSpec })
    }
  }


  handleDelete(extension){
    console.log('handleDeleteExtension', extension)
  }

  onSuccess(form){
    console.log('onSuccessAddExtension')

    let formSpecValues = form.values()

    const convertedFormSpecValues = Object.keys(formSpecValues).map(function(key, index) {
        return {
            'key': key,
            'value': formSpecValues[key]
        }
    })

    console.log(formSpecValues)

    if(this.props.viewType === 'edit'){
        this.props.createExtension({
          variables: {
            'projectId': this.props.project.id,
            'extensionSpecId': this.state.extensionSpec.id,
            'formSpecValues': convertedFormSpecValues,
            'environmentId': this.props.store.app.currentEnvironment.id,
          }
        }).then(({ data }) => {
          console.log(data)
        }).catch(error => {
          this.setState({ addButtonDisabled: false, buttonText: 'Add' })
          console.log(error)
        })
    } else if(this.props.viewType === 'read'){
        console.log(this.state.extension)
        this.props.updateExtension({
          variables: {
            'id': this.state.extension.id,
            'projectId': this.props.project.id,
            'extensionSpecId': this.state.extensionSpec.id,
            'formSpecValues': convertedFormSpecValues,
            'environmentId': this.props.store.app.currentEnvironment.id,
          }
        }).then(({ data }) => {
          console.log(data)
        }).catch(error => {
          this.setState({ addButtonDisabled: false, buttonText: 'Add' })
          console.log(error)
        })
    }
  }


  onError(form){
    console.log('onErrorAddExtension')
  }

  onAdd(extension, event){
    console.log('handleAddExtension', extension)
    let buttonText = "Adding"
    if(this.props.viewType === "read"){
        buttonText = "Updating"
    }
    this.setState({ addButtonDisabled: true, buttonText: buttonText})

    if(this.form){
      this.form.onSubmit(event, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
    }
  }


  render(){
    const { viewType } = this.props;

    console.log(this.state)

    let view = (<div></div>);

    if(viewType === "edit"){
      view = (
        <div>
          <form onSubmit={(e) => e.preventDefault()}>
            <Grid container spacing={24}>
              <Grid item xs={12}>
                <InputField field={this.form.$('hostname')} />
              </Grid>
              <Grid item xs={12}>
                <InputField field={this.form.$('credentials')} />
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Button raised color="primary" className={styles.rightPad}
                onClick={this.onAdd.bind(this)}
                disabled={this.state.addButtonDisabled}
              >
                {this.state.buttonText}
              </Button>
              <Button color="primary"
                className={styles.paddingLeft}
                onClick={this.props.handleClose}
              >
                cancel
              </Button>
            </Grid>
          </form>

        <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
          <DialogTitle>{"Ae you sure you want to delete " + this.state.extensionSpec.name + "?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will remove the service spec and all instances in which it is being used in any existing services.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleDelete.bind(this)} color="accent">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>


        </div>
      )
    }

    if(viewType === "read"){
      view = (
        <div>
          <form onSubmit={(e) => e.preventDefault()}>
            <Grid container spacing={24}>
              <Grid item xs={12}>
                <InputField field={this.form.$('hostname')} />
              </Grid>
              <Grid item xs={12}>
                <InputField field={this.form.$('credentials')} />
              </Grid>
            </Grid>
            <Grid item xs={12}>
                <Paper>
                    <Toolbar>
                        <div>
                            <Typography type="title">
                                Artifacts
                            </Typography>
                        </div>
                    </Toolbar>
                    <Table bodyStyle={{ overflow: 'visible' }}>
                        <TableHead>
                            <TableRow>
                                    <TableCell>
                                        Key
                                    </TableCell>
                                    <TableCell>
                                        Value
                                    </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {this.state.extension.artifacts.map(artifact=> {
                            return (
                                <TableRow>
                                    <TableCell>
                                      {artifact.key}
                                    </TableCell>
                                    <TableCell>
                                      {artifact.value}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        </TableBody>
                    </Table>
                </Paper>
            </Grid>
            <Grid item xs={12}>
              <Button raised color="primary" className={styles.rightPad}
                onClick={this.onAdd.bind(this)}
                disabled={this.state.addButtonDisabled}
              >
                {this.state.buttonText}
              </Button>
              <Button color="primary"
                className={styles.paddingLeft}
                onClick={this.props.handleClose}
              >
                cancel
              </Button>
            </Grid>
          </form>
        </div>
      )
    }


    return view
  }

}
