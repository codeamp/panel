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

import { graphql, gql } from 'react-apollo';

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



export default class DockerBuilder extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      dialogOpen: false,
    }
  }

  componentWillMount(){
    const fields = [
      'registry',
      'imageName',
    ];

    const rules = {
      'registry': 'required|string',
      'imageName': 'required|string',
    };

    const labels = {
      'registry': 'Registry URL',
      'imageName': 'Image Name',
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
    console.log(form)
    let stringFormValues = JSON.stringify(form.values())

		console.log(form.values())

    this.props.createExtension({
      variables: {
        'projectId': this.props.project.id,
        'extensionSpecId': this.props.extensionSpec.id,
        'formSpecValues': stringFormValues,
      }
    }).then(({ data }) => {
      console.log(data)
    }).catch(error => {
      console.log(error)
    })
  }

  onError(form){
    console.log('onErrorAddExtension')
    console.log(form)
  }

  onAdd(extension, event){
    console.log('handleAddExtension', extension)
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
                <InputField field={this.form.$('registry')} />
              </Grid>
              <Grid item xs={12}>
                <InputField field={this.form.$('imageName')} />
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Button raised color="primary" className={styles.rightPad}
                onClick={this.onAdd.bind(this)}
              >
                add
              </Button>
              <Button color="primary"
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
