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
import SecretsPaginator from './paginator';

@inject("store") @observer


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
      limit: props.limit || this.props.store.app.paginator.limit,
      page: 0,
      project: null
    }

    // check url query params
    if(this.props.history.location.search !== ""){
      const searchParams  = new URLSearchParams(this.props.history.location.search)
      let limit           = parseInt(searchParams.get("limit"), 10) || this.state.limit
      let page            = parseInt(searchParams.get("page"), 10) || this.state.page
      if (page < 1){
        page = 1
      }   

      if(limit < 1){
        limit = this.state.limit
      }   

      this.props.history.push({
        pathname: this.props.location.pathname,
        search: '?page=' + page + "&limit=" + limit
      })

      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.page = page - 1

      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.limit = limit
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
    console.log("on submit")

    this.setState({ saving: true})
    this.form.$('key').set('disabled', false)
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  onClick(projectID, secret, secretIdx){
    console.log("Secret:", secret)
    if(secret !== null){
      // find this
      this.form = this.initProjectSecretsForm({
        'key': secret.key,
        'value': secret.value,
        'type': secret.type,
        'id': secret.id,
        'index': secretIdx,
        'isSecret': secret.isSecret,
        'projectID': projectID,
        'environmentID': this.props.store.app.currentEnvironment.id,
        'scope': 'project',
      })
      this.form.$('key').set('disabled', true)
      this.form.$('isSecret').set('disabled', true)

      this.openDrawer()
    }
  }

  onClickVersion(versionIdx) {
    console.log("onClickVersion")
    this.form.$('value').set(this.props.data.project.secrets.entries[this.form.values()['index']].versions[versionIdx].value)
  }

  onError(form){
    console.log("onerror")
    // todo
    this.setState({ saving: false })
  }

  onSuccess(form){
    console.log("on success")
    var self = this

    console.log(form.values())

    this.form.$('key').set('disabled', false)
    if(this.form.values()['id'] === ''){
      this.props.createSecret({
        variables: form.values(),
      }).then(({data}) => {
        console.log(data)
        this.setState({})
        this.closeDrawer(true)
      });
    } else {
      this.props.updateSecret({
        variables: form.values(),
      }).then(({data}) => {
        self.setState({})
        self.form.$('key').set('disabled', true)
        self.form.$('id').set(data.updateSecret.id)
        self.form.$('value').set(data.updateSecret.value)
        self.setState({ saving: false })

        this.closeDrawer(true)
      });
    }
  }

  handleProjectLoaded(project){

    if (this.state.project !== project) {
      this.setState({project:project})
    }
  }

  handleRequestClose = value => {
    console.log("handleRequestClose")
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

  setNextPage(totalPages){
    let limit = this.state.limit
    let page = this.state.page + 1
    if (page >= totalPages) {
      return
    }

    this.setState({page: page, limit: limit})

    this.props.history.replace({
      pathname: this.props.location.pathname,
      search: '?page=' + (page+1) + "&limit=" + this.state.limit
    })
  }

  setPreviousPage(){
    let limit = this.state.limit
    let page = this.state.page - 1
    if (page < 0) {
      return
    }    

    this.setState({page: page, limit: limit})

    this.props.history.push({
      pathname: this.props.location.pathname,
      search: '?page=' + (page+1) + "&limit=" + this.state.limit
    })
  }

  handleOutOfBounds(maxPage, limit){
    this.props.history.push({
      pathname: this.props.location.pathname,
      search: '?page=' + maxPage + "&limit=" + limit
    })

    this.setState({page:maxPage-1, limit:limit})
  }

  render() {
    const { project } = this.state
    
    return (
      <div>
        <SecretsPaginator {...this.props}
          handleBackButtonClick={this.setPreviousPage.bind(this)}
          handleNextButtonClick={this.setNextPage.bind(this)}
          handleOutOfBounds={this.handleOutOfBounds.bind(this)}
          handleProjectLoaded={this.handleProjectLoaded.bind(this)}
          onClick={this.onClick.bind(this)}
          limit={this.state.limit}
          page={this.state.page}/> 
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

                    {this.form.values()['index'] >= 0 && project && project.secrets.entries[this.form.values()['index']] &&
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

        {project && project.secrets.entries.length > 0 && project.secrets.entries[this.form.values()['index']] &&
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
