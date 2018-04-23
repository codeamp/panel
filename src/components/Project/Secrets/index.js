import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import Menu, { MenuItem } from 'material-ui/Menu';
import InputField from 'components/Form/input-field';
import CheckboxField from 'components/Form/checkbox-field';
import Loading from 'components/Utils/Loading';
import EnvVarVersionHistory from 'components/Utils/EnvVarVersionHistory';
import AddIcon from 'material-ui-icons/Add';
import styles from './style.module.css';
import { observer, inject } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import AceEditor from 'react-ace';
import 'brace/mode/yaml';
import 'brace/theme/github';

const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
  }
}

@inject("store") @observer
@graphql(gql`
query Project($slug: String, $environmentID: String){
  project(slug: $slug, environmentID: $environmentID) {
    id
    name
    secrets {
      id
      key
      value
      isSecret
      user {
        id
        email
      }
      versions {
        value
        created
        user {
          id
          email
        }
      }      
      type
      created
    }
  }
}`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.store.app.currentEnvironment.id,
    }
  })
})

@graphql(gql`
  mutation CreateSecret ($key: String!, $value: String!, $projectID: String!, $type: String!, $scope: String!, $isSecret: Boolean!, $environmentID: String!) {
    createSecret(secret:{
    projectID: $projectID,
    key: $key,
    value: $value,
    type: $type,
    scope: $scope,
    isSecret: $isSecret,
    environmentID: $environmentID,
    }) {
        id
        key
        value
        user {
          id
          email
        }
        project {
          id
          name
        }
        created
    }
}`, {name: "createSecret"})

@graphql(gql`
mutation UpdateSecret ($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $isSecret: Boolean!, $environmentID: String!) {
    updateSecret(secret:{
    id: $id,
    key: $key,
    value: $value,
	  type: $type,
    scope: $scope,
    isSecret: $isSecret,
    environmentID: $environmentID,
    }) {
        id
        value
        user {
          id
          email
        }
        project {
          id
          name
        }
        created
    }
}`, {name: "updateSecret"})

@graphql(gql`
mutation DeleteSecret ($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $isSecret: Boolean!, $environmentID: String!) {
    deleteSecret(secret:{
    id: $id,
    key: $key,
    value: $value,
	  type: $type,
    scope: $scope,
    isSecret: $isSecret,
    environmentID: $environmentID,
    }) {
        id
        key
        value
        user {
          id
          email
        }
        project {
          id
          name
        }
        created
    }
}`, {name: "deleteSecret"})

export default class Secrets extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      addEnvVarMenuOpen: false,
      saving: false,
      drawerOpen: false,
      dialogOpen: false,
    }
  }

  componentWillMount(){
    const fields = [
      'id',
      'projectID',
      'key',
      'value',
      'created',
      'type',
      'scope',
      'isSecret',
      'environmentID',
      'index',
    ];
    const rules = {
      'key': 'string|required',
      'value': 'string|required',
    };
    const labels = {
      'key': 'Key',
      'value': 'Value',
      'isSecret': 'Protected',
    };
    const initials = {}
    const types = {
      'isSecret': 'checkbox'
    };
    const keys = {};
    const disabled = {
      'key': false
    }
    const extra = {
      'type': [{key: 'build', value: 'Build'}, {key: 'env', value: 'Normal' },{key: 'file', value: 'File'}]
    };
    const hooks = {};
    const plugins = { dvr: validatorjs };

    this.form = new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys }, { plugins });
  }

  handleAddClick(event){
    this.setState({ addEnvVarMenuOpen: true, anchorEl: event.currentTarget });
  }

  onSubmit(e) {

    this.setState({ saving: true})
    this.form.$('key').set('disabled', false)
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  onClick(secretIdx){
    const secret = this.props.data.project.secrets[secretIdx]
    if(secret !== undefined){
        this.form.$('key').set(secret.key)
        this.form.$('key').set('disabled', true)
        this.form.$('value').set(secret.value)
        this.form.$('type').set(secret.type)
        this.form.$('id').set(secret.id)
        this.form.$('index').set(secretIdx)
        this.form.$('isSecret').set(secret.isSecret)
        this.form.$('isSecret').set('disabled', true)
        this.openDrawer()
    }
  }

  onClickVersion(versionIdx) {
    this.form.$('value').set(this.props.data.project.secrets[this.form.values()['index']].versions[versionIdx].value)
  }

  onError(form){
    // todo
    this.closeDrawer()
  }

  onSuccess(form){
    form.$('projectID').set(this.props.data.project.id)
    form.$('environmentID').set(this.props.store.app.currentEnvironment.id)
    form.$('scope').set('project')
    var self = this

    this.form.$('key').set('disabled', false)
    if(this.form.values()['id'] === ''){
      this.props.createSecret({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
      });
    } else {
      this.props.updateSecret({
        variables: form.values(),
      }).then(({data}) => {
        self.props.data.refetch()
        self.form.$('key').set('disabled', true)
        self.form.$('id').set(data.updateSecret.id)
        self.form.$('value').set(data.updateSecret.value)
        self.setState({ saving: false })
      });
    }
  }

  handleRequestClose = value => {
    this.form.clear()
    this.form.$('type').set(value);
    this.form.$('key').set('disabled', false)
    this.form.$('isSecret').set('disabled', false)
    this.openDrawer()
  };

  openDrawer(){
    this.setState({ addEnvVarMenuOpen: false, drawerOpen: true, saving: false })
  }

  closeDrawer(){
    this.form.reset()
    this.form.showErrors(false)
    this.setState({ drawerOpen: false, addEnvVarMenuOpen: false, saving: true, dialogOpen: false })
  }

  handleDeleteEnvVar(){
    this.props.deleteSecret({
      variables: this.form.values(),
    }).then(({data}) => {
      this.closeDrawer()
      this.props.data.refetch()
    });
  }

  onFileEditorChange(newValue) {
    this.form.$('value').set(newValue)
  }

  render() {
    const { loading, project } = this.props.data;
    if(loading){
      return (
        <Loading />
      )
    }
    var self = this;
    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <Typography variant="title">
              Secrets
            </Typography>
          </Toolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Key
                </TableCell>
                <TableCell>
                  Type
                </TableCell>
                <TableCell>
                  Protected
                </TableCell>
                <TableCell>
                  Creator
                </TableCell>
                <TableCell>
                  Created
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.secrets.map(function(secret, idx){
                let emptyValue
                if (secret.value === '') {
                  emptyValue = styles.emptyValue
                }
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    onClick={()=> self.onClick(idx)}
                    key={secret.id}>
                    <TableCell>
                      <span className={emptyValue}>{secret.key}</span>
                    </TableCell>
                    <TableCell>
                      {secret.type}
                    </TableCell>
                    <TableCell>
                      {secret.isSecret ? "yes" : "no" }
                    </TableCell>
                    <TableCell>
                      {secret.user.email}
                    </TableCell>
                    <TableCell>
                      {new Date(secret.created).toString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>

        <Button variant="fab" aria-label="Add" type="submit" color="primary"
            style={inlineStyles.addButton}
            onClick={this.handleAddClick.bind(this)}>
            <AddIcon />
        </Button>

        <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={this.state.addEnvVarMenuOpen}
            onRequestClose={this.handleRequestClose}
        >
          <MenuItem onClick={() => this.handleRequestClose("env")}>Normal</MenuItem>
          <MenuItem onClick={() => this.handleRequestClose("build")}>Build Arg</MenuItem>
          <MenuItem onClick={() => this.handleRequestClose("file")}>File</MenuItem>
        </Menu>

        <Drawer
            anchor="right"
            classes={{
            paper: styles.list,
            }}
            open={this.state.drawerOpen}
        >
            <div tabIndex={0} className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                  <Toolbar>
                    <Typography variant="title" color="inherit">
                        Environment Variable
                    </Typography>
                  </Toolbar>
              </AppBar>
              <form>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24} className={styles.grid}>
                    {(this.form.$('type').value === 'env' || this.form.$('type').value === 'build') &&
                      <Grid item xs={12}>
                        <Grid item xs={12}>
                          <InputField field={this.form.$('key')} fullWidth={true} />
                        </Grid>
                        <Grid item xs={12}>
                          <InputField field={this.form.$('value')} fullWidth={true} />
                          <CheckboxField field={this.form.$('isSecret')} fullWidth={true} />
                          <Typography variant="caption"> Hide value after saving </Typography>
                        </Grid>
                      </Grid>
                    }

                    {this.form.$('type').value === 'file' &&
                      <Grid item xs={12}>
                        <Grid item xs={12}>
                          <InputField field={this.form.$('key')} fullWidth={true} />
                        </Grid>
                        <Grid item xs={12}>
                          <AceEditor
                            width="100%"
                            mode="yaml"
                            theme="github"
                            onChange={this.onFileEditorChange.bind(this)}
                            value={this.form.values()['value']}
                            name="file-content"
                            editorProps={{$blockScrolling: true}}
                            focus="true"
                          />
                          <CheckboxField field={this.form.$('isSecret')} fullWidth={true} />
                          <Typography variant="caption"> Hide value after saving </Typography>
                        </Grid>
                      </Grid>
                    }

                    {this.form.values()['index'] >= 0 && project.secrets[this.form.values()['index']] &&
                      <EnvVarVersionHistory 
                        versions={project.secrets[this.form.values()['index']].versions}
                        onClickVersion={this.onClickVersion.bind(this)}
                      />
                    }    

                    <Grid item xs={12}>
                      <Button color="primary"
                          className={styles.buttonSpacing}
                          disabled={this.state.saving}
                          type="submit"
                          variant="raised"
                          onClick={e => this.onSubmit(e)}>
                          Save
                      </Button>

                      {this.form.values()['id'] !== "" &&
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
                </div>
              </form>
            </div>
        </Drawer>
        {project.secrets.length > 0 && project.secrets[this.form.values()['index']] &&
            <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
              <DialogTitle>{"Are you sure you want to delete " + project.secrets[this.form.values()['index']].key + "?"}</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {"This will delete the environment variable and all its versions."}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
                  Cancel
                </Button>
                <Button onClick={this.handleDeleteEnvVar.bind(this)} style={{ color: "red" }}>
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>
        }
      </div>
    )
  }
}
