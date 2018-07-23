import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
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
import PanelTable from 'components/Utils/Table';
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

@inject("store") @observer
@graphql(gql`
query Project($slug: String, $environmentID: String, $params: PaginatorInput!){
  project(slug: $slug, environmentID: $environmentID) {
    id
    name
    secrets(params:$params) {
      nextCursor
      page
      count
      entries {
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
  }
}`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.store.app.currentEnvironment.id,
      params: {
        limit: props.limit || props.store.app.paginator.limit,
        cursor: props.store.app.paginator.cursor,
      },
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
      dirtyFormDialogOpen: false,
      cursorStack: [],
    }

    // check url query params
    if(this.props.history.location.search !== ""){
        const cursor = new URLSearchParams(this.props.history.location.search).get("cursor")
        if(cursor !== "" && cursor !== null){
            this.props.store.app.setPaginator({
                limit: this.props.limit || this.props.store.app.paginator.limit,
                cursor: cursor,
            })
            this.props.data.refetch()
        }
    }
  }

  initProjectSecretsForm(formInitials  = {}) {
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
    ]
    const rules = {
      'key': 'string|required',
      'value': 'string|required',
    }
    const labels = {
      'key': 'Key',
      'value': 'Value',
      'isSecret': 'Protected',
    }
    const initials = formInitials
    const types = {
      'isSecret': 'checkbox'
    }
    const keys = {}
    const disabled = {
      'key': false
    }
    const extra = {
      'type': [{key: 'build', value: 'Build'}, {key: 'env', value: 'Normal' },{key: 'file', value: 'File'}]
    }
    const hooks = {}
    const plugins = { dvr: validatorjs }

    return new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys }, { plugins });
  }

  componentWillMount(){
    this.form = this.initProjectSecretsForm()
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
    const secret = this.props.data.project.secrets.entries[secretIdx]
    if(secret !== null){
      // find this
      this.form = this.initProjectSecretsForm({
        'key': secret.key,
        'value': secret.value,
        'type': secret.type,
        'id': secret.id,
        'index': secretIdx,
        'isSecret': secret.isSecret,
        'projectID': this.props.data.project.id,
        'environmentID': this.props.store.app.currentEnvironment.id,
      })
      this.form.$('key').set('disabled', true)
      this.form.$('isSecret').set('disabled', true)

      this.openDrawer()
    }
  }

  onClickVersion(versionIdx) {
    this.form.$('value').set(this.props.data.project.secrets.entries[this.form.values()['index']].versions[versionIdx].value)
  }

  onError(form){
    // todo
    this.setState({ saving: false })
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
        this.closeDrawer(true)
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
    this.form = this.initProjectSecretsForm({
      'type': value,
    })
    this.form.$('key').set('disabled', false)
    this.form.$('isSecret').set('disabled', false)
    this.openDrawer()
  };

  openDrawer(){
    this.setState({ addEnvVarMenuOpen: false, drawerOpen: true, saving: false })
  }

  closeDrawer(force = false){
    if(!force && this.form.isDirty){
      this.setState({ dirtyFormDialogOpen: true })
    } else {
      this.setState({ drawerOpen: false, addEnvVarMenuOpen: false, saving: true, dialogOpen: false, dirtyFormDialogOpen: false })
    }
  }

  handleDeleteEnvVar(){
    this.props.deleteSecret({
      variables: this.form.values(),
    }).then(({data}) => {
      this.closeDrawer(true)
      this.props.data.refetch()
    });
  }

  onFileEditorChange(newValue) {
    this.form.$('value').set(newValue)
  }

  setNextPage(){
    let cursorStack = this.state.cursorStack
    let nextCursor = this.props.data.project.secrets.nextCursor

    this.props.data.refetch({
      params: {
        limit: this.props.limit || this.props.store.app.paginator.limit,
        cursor: nextCursor,
      }
    }).then(({data}) => {
      cursorStack.push(this.props.store.app.paginator.cursor)
      this.setState({
        cursorStack: cursorStack
      })
      this.props.store.app.setPaginator({
        limit: this.props.limit || this.props.store.app.paginator.limit,
        cursor: nextCursor,
      })

      if(nextCursor !== null){
        this.props.history.push({
          pathname: this.props.location.pathname,
          search: '?cursor=' + nextCursor
        })
      } else {
        this.props.data.refetch()
      }
    })
  }

  setPreviousPage(){
    let cursorStack = this.state.cursorStack
    let cursor = cursorStack.pop()

    this.setState({
      cursorStack: cursorStack
    })
    this.props.store.app.setPaginator({
      limit: this.props.limit || this.props.store.app.paginator.limit,
      cursor: cursor,
    })

    if(cursor !== null){
      this.props.history.push({
        pathname: this.props.location.pathname,
        search: '?cursor=' + cursor
      })
    } else {
      this.props.data.refetch()
    }
  }

  render() {
    const { loading, project } = this.props.data;
    if(loading){
      return (
        <Loading />
      )
    }

    return (
      <div>
        <PanelTable
          title={"Secrets"}
          rows={project.secrets.entries}
          handleBackButtonClick={this.setPreviousPage.bind(this)}
          handleNextButtonClick={this.setNextPage.bind(this)}
          onClick={this.onClick.bind(this)}
          paginator={{
            count: project.secrets.count,
            nextCursor: project.secrets.nextCursor,
            page: project.secrets.page,
            rowsPerPage: this.props.limit || this.props.store.app.paginator.limit,
          }}
          columns={[{
            label: "Key",
            getVal: function(row){return row.key},
          }, {
            label: "Type",
            getVal: function(row){return row.type},
          }, {
            label: "Protected",
            getVal: function(row){
              if(row.isSecret)
                return "yes"
              return "no"
            },
          }, {
            label: "Creator",
            getVal: function(row){return row.user.email},
          }, {
            label: "Created",
            getVal: function(row){return new Date(row.created).toString()},
          }]}
        />

        <Button variant="fab" aria-label="Add" type="submit" color="primary"
            className={styles.addButton}
            onClick={this.handleAddClick.bind(this)}>
            <AddIcon />
        </Button>

        <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={this.state.addEnvVarMenuOpen}
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
            onClose={() => {this.closeDrawer()}}
            open={this.state.drawerOpen}
        >
            <div tabIndex={0} className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                  <Toolbar>
                    <Typography variant="title" color="inherit">
                        Secret
                    </Typography>
                  </Toolbar>
              </AppBar>
              <form>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24} className={styles.grid}>
                    {(this.form.$('type').value === 'env' || this.form.$('type').value === 'build') &&
                      <Grid item xs={12}>
                        <Grid item xs={12}>
                          <InputField field={this.form.$('key')} fullWidth={true} disabled={this.form.$('key').disabled} />
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

                    {this.form.values()['index'] >= 0 && project.secrets.entries[this.form.values()['index']] &&
                      <EnvVarVersionHistory
                        versions={project.secrets.entries[this.form.values()['index']].versions}
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
                        onClick={() => {this.closeDrawer()}}>
                        Cancel
                      </Button>
                    </Grid>
                  </Grid>
                </div>
              </form>
            </div>
        </Drawer>

        {/* Used for confirmation of escaping panel if dirty form */}
        <Dialog open={this.state.dirtyFormDialogOpen}>
          <DialogTitle>{"Are you sure you want to escape?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {"You'll lose any progress made so far."}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> this.setState({ dirtyFormDialogOpen: false })} color="primary">
              Cancel
            </Button>
            <Button onClick={() => {this.closeDrawer(true)}} style={{ color: "red" }}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {project.secrets.entries.length > 0 && project.secrets.entries[this.form.values()['index']] &&
            <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
              <DialogTitle>{"Are you sure you want to delete " + project.secrets.entries[this.form.values()['index']].key + "?"}</DialogTitle>
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
