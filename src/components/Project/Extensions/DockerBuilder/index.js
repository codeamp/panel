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

export default class DockerBuilder extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      dialogOpen: false,
      addButtonDisabled: false,
      extension: null,
      extensionSpec: null,
    }
  }

  componentWillMount(){
    this.setupForm()
  }

  setupForm(){
    const fields = [
      'USER',
      'PASSWORD',
      'EMAIL',
    ];

    const rules = {
      'USER': 'required|string',
      'PASSWORD': 'required|string',
      'EMAIL': 'required|string',
    };

    const labels = {
      'USER': 'User',
      'PASSWORD': 'Password',
      'EMAIL': 'Email',
    };

    const initials = {};
    const types = {
      'PASSWORD': 'password',
    };
    const extra = {}
    const hooks = {};
    const plugins = { dvr: validatorjs };

    this.form = new MobxReactForm({ fields, rules, labels, initials, types, extra, hooks, plugins })


    // reflect viewType in state props
    if(this.props.viewType === "read"){
        let obj = {}
        this.props.extension.formSpecValues.map(function(kv) {
            obj[kv['key']] = kv.value
        })


        this.form.$('USER').set(obj['USER'])
        this.form.$('PASSWORD').set(obj['PASSWORD'])
        this.form.$('EMAIL').set(obj['EMAIL'])

        this.setState({ extension: this.props.extension, extensionSpec: this.props.extensionSpec })
    } else if(this.props.viewType === "edit"){
        this.setState({ extensionSpec: this.props.extensionSpec })
    }
  }

  onSuccess(form){
    // convert obj -> { "config": [kv] }
    var self = this
    var userConfig = {
      "config": [],
      "form": this.form.values(),
    }
    Object.keys(this.props.config.values()).map(function(key){
      userConfig.config.push({ "key": key, "value": self.props.config.values()[key] })
    })

    console.log(userConfig.config)

    if(this.props.viewType === 'edit'){
        let vars = {
          'projectId': this.props.project.id,
          'extensionSpecId': this.state.extensionSpec.id,
          'config': userConfig,
          'environmentId': this.props.store.app.currentEnvironment.id,
        }
        this.props.createExtension({
          variables: {
            'projectId': this.props.project.id,
            'extensionSpecId': this.state.extensionSpec.id,
            'config': userConfig,
            'environmentId': this.props.store.app.currentEnvironment.id,
          }
        }).then(({ data }) => {
          this.setState({ addButtonDisabled: false })
          this.props.refetch()
          this.props.handleClose()
        });
    } else if(this.props.viewType === 'read'){
        this.props.updateExtension({
          variables: {
            'id': this.state.extension.id,
            'projectId': this.props.project.id,
            'extensionSpecId': this.state.extensionSpec.id,
            'config': userConfig,
            'environmentId': this.props.store.app.currentEnvironment.id,
          }
        });
    }
  }

  onError(form){
    // todo
  }

  onAdd(extension, event){
    this.setState({ addButtonDisabled: true })
    if(this.form){
      this.form.onSubmit(event, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
    }
  }


  render(){
    const { viewType } = this.props;
    let view = (<div></div>);
    if(viewType === "edit"){
      view = (
        <div>
          <form onSubmit={(e) => e.preventDefault()}>
            <Grid container spacing={24}>
              <Grid item xs={12}>
                <InputField field={this.form.$('USER')} />
              </Grid>
              <Grid item xs={12}>
                <InputField field={this.form.$('PASSWORD')} />
              </Grid>
              <Grid item xs={12}>
                <InputField field={this.form.$('EMAIL')} />
              </Grid>
            </Grid>
          </form>
          <Grid item xs={12}>
              <Button raised color="primary" className={styles.rightPad}
                onClick={this.onAdd.bind(this)}
                disabled={this.state.addButtonDisabled}
              >
                Save
              </Button>
              <Button color="primary"
                className={styles.paddingLeft}
                onClick={this.props.handleClose}
              >
                cancel
              </Button>
            </Grid>          
        </div>
      )
    }

    if(viewType === "read"){
      view = (
        <div>
          <form onSubmit={(e) => e.preventDefault()}>
            <Grid container spacing={24}>
              <Grid item xs={12}>
                <InputField field={this.form.$('USER')} />
              </Grid>
              <Grid item xs={12}>
                <InputField field={this.form.$('PASSWORD')} />
              </Grid>
              <Grid item xs={12}>
                <InputField field={this.form.$('EMAIL')} />
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
                    <Table>
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
                      {this.state.extension.artifacts.map(artifact=> (
                        <TableRow>
                          <TableCell>
                            {artifact.key}
                          </TableCell>
                          <TableCell>
                            {artifact.value}
                          </TableCell>
                        </TableRow>
                      ))}
                      </TableBody>
                    </Table>
                </Paper>
            </Grid>
          </form>
        </div>
      )
    }

    return view
  }

}
