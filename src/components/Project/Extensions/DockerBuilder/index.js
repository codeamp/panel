import React from 'react';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
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

export default class DockerBuilder extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      dialogOpen: false,
      addButtonDisabled: false,
      buttonText: 'Add',
    }
  }

  componentWillMount(){
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


    this.props.createExtension({
      variables: {
        'projectId': this.props.project.id,
        'extensionSpecId': this.props.extensionSpec.id,
        'formSpecValues': convertedFormSpecValues,
      }
    }).then(({ data }) => {
      console.log(data)
    }).catch(error => {
      this.setState({ addButtonDisabled: false, buttonText: 'Add' })
      console.log(error)
    })
  }

  onError(form){
    console.log('onErrorAddExtension')
  }

  onAdd(extension, event){
    console.log('handleAddExtension', extension)
    this.setState({ addButtonDisabled: true, buttonText: 'Adding'})

    if(this.form){
      this.form.onSubmit(event, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
    }
  }


  render(){
    const { viewType, extensionSpec } = this.props;

    let view = (<div></div>)

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
          <DialogTitle>{"Ae you sure you want to delete " + extensionSpec.name + "?"}</DialogTitle>
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
          read
        </div>
      )
    }

    return view
  }

}
