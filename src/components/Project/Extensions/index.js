import React from 'react';
import { observer, inject } from 'mobx-react';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import { CircularProgress } from 'material-ui/Progress';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import ExtensionStateCompleteIcon from 'material-ui-icons/CheckCircle';
import ExtensionStateFailedIcon from 'material-ui-icons/Error';
import EnvVarSelectField from 'components/Form/envvar-select-field';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import styles from './style.module.css';
import _ from "lodash"

@inject("store") 

@graphql(gql`
  query ProjectExtensions($slug: String, $environmentID: String){
    project(slug: $slug, environmentID: $environmentID) {
      id
      name
      slug
      extensions {
        id
        extension {
          id
          name
          component
          config
          type
          key
          created
        }
        state
        stateMessage
        config
        artifacts
        created
      }
      secrets {
        id
        key
        value
        created
        scope
        type
        environment {
          id
          name
          created
        }        
      }
    }
    extensions {
      id
      name
      component
      config
      type
      key
      created
      environment {
        id
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
  mutation CreateProjectExtension ($projectID: String!, $extensionID: String!, $config: JSON!, $environmentID: String!) {
      createProjectExtension(projectExtension:{
        projectID: $projectID,
        extensionID: $extensionID,
        config: $config,
        environmentID: $environmentID,
      }) {
          id
      }
  }`, { name: "createProjectExtension" }
)

@graphql(gql`
  mutation UpdateProjectExtension ($id: String, $projectID: String!, $extensionID: String!, $config: JSON!, $environmentID: String!) {
      updateProjectExtension(projectExtension:{
        id: $id,
        projectID: $projectID,
        extensionID: $extensionID,
        config: $config,
        environmentID: $environmentID,
      }) {
          id
      }
  }`, { name: "updateExtension" }
)

@graphql(gql`
  mutation DeleteProjectExtension ($id: String, $projectID: String!, $extensionID: String!, $config: JSON!, $environmentID: String!) {
      deleteProjectExtension(projectExtension:{
        id: $id,
        projectID: $projectID,
        extensionID: $extensionID,
        config: $config,
        environmentID: $environmentID,
      }) {
          id
      }
  }`, { name: "deleteExtension" }
)

@observer
export default class ProjectExtensions extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      extensionDrawer: {
        open: false,
        extension: null,
        formType: "",
      },
      dialogOpen: false,
    }
  }

  componentWillMount(){
    this.setupSocketHandlers();
  }
  
  setupSocketHandlers(){
    const { socket, match } = this.props;
    
    socket.on(match.url.substring(1, match.url.length), (data) => {
      this.props.data.refetch()
    });    
  }  

  async openExtensionDrawer(e, extension){
    let component = null
    let formType = null
    console.log(extension)
    // check typename to know if Extension or ProjectExtension
    if(extension.__typename === "ProjectExtension"){
      component = extension.extension.component;
      formType = "enabled";
    } else if(extension.__typename === "Extension") {
      component = extension.component;
      formType = "available";
    } else {
      return;
    }
    
    if (component !== ""){
      try {
        await import("./" + component)
        .then((c) => {
          component = c.default
        });
      }
      catch (e) {}
    }

    this.setState({
      extensionDrawer: {
        open: true,
        extension: extension, 
        customForm: component,
        formType: formType,
      }
    })
  } 
  
  closeExtensionDrawer(){
    this.setState({
      extensionDrawer: {
        open: false,
        extension: null, 
      },
      dialogOpen: false,
    })
  }

  saveExtension(e){
    let { extension } = this.state.extensionDrawer
    
    let formValues = this.form.values()
    if (this.customForm) {
      formValues.custom = this.customForm.values()
    } else {
      formValues.custom = {}
    }

    if (extension.extension) {
      this.props.updateExtension({
        variables: {
          'id': extension.id,
          'projectID': this.props.data.project.id,
          'extensionID': extension.extension.id,
          'config': formValues,
          'environmentID': this.props.store.app.currentEnvironment.id,
        }
      }).then(({ data }) => {
        this.props.data.refetch()
        this.closeExtensionDrawer()
      })      
    } else {
      this.props.createProjectExtension({
        variables: {
          'projectID': this.props.data.project.id,
          'extensionID': extension.id,
          'config': formValues,
          'environmentID': this.props.store.app.currentEnvironment.id,
        }
      }).then(({ data }) => {
        this.props.data.refetch()
        this.closeExtensionDrawer()
      })      
    }
  }

  deleteExtension(){
    let { extension } = this.state.extensionDrawer

    if (!extension.extension) {
      return;
    }

    this.props.deleteExtension({
      variables: {
        'id': extension.id,
        'projectID': this.props.data.project.id,
        'extensionID': extension.extension.id,
        'config': extension.config,
        'environmentID': this.props.store.app.currentEnvironment.id,
      }
    }).then(({ data }) => {
      this.props.data.refetch()
      this.closeExtensionDrawer()
    })
  }

  componentWillUpdate(nextProps, nextState){
    nextProps.data.refetch()
  } 

  render() {
    const { loading, project } = this.props.data;

    if(loading) {
      return (<div>Loading...</div>);
    }

    return (
      <div>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            {this.renderEnabledExtensions()}
          </Grid>
          <Grid item xs={12}>
            {this.renderAvailableExtensions()}
          </Grid>
        </Grid>

        <Dialog open={this.state.dialogOpen}>
          <DialogTitle>{"Are you sure you want to delete"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {"This will delete the extension and all its generated environment variables and cloud resources associated with " + project.name + "."}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
              Cancel
            </Button>
            <Button onClick={this.deleteExtension.bind(this)} color="accent">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        <Drawer
          anchor="right"
          classes={{
            paper: styles.drawer
          }}
          open={this.state.extensionDrawer.open}
        >
          {this.renderExtensionsDrawer()}
        </Drawer>
      </div>
    )
  }

  renderAvailableExtensions() {
    const { extensions, project } = this.props.data;

    let availableExtensions = extensions.reduce((extensions, extension) => {
      let found = false
      project.extensions.forEach(function(extension) {
        if (extension.extension.id === extension.id && extension.extension.type !== 'once') {
          found = true 
        }
      })
      
      if (!found && extension.environment.id === this.props.store.app.currentEnvironment.id) {
        extensions.push(
          <TableRow
            hover
            onClick={event => this.openExtensionDrawer(event, extension)}
            key={extension.id}
          >
            <TableCell> { extension.name } </TableCell>
            <TableCell> { extension.type } </TableCell>
          </TableRow>
        );
      }

      return extensions;
    }, []);

    return (<Paper>
      <Toolbar>
        <div>
          <Typography variant="title">
            Available extensions
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
              Type
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {availableExtensions}
        </TableBody>
      </Table>
    </Paper>
    )
  }

  renderEnabledExtensions() {
    const { project } = this.props.data;

    return (<Paper>
      <Toolbar>
        <div> <Typography variant="title">
            Enabled extensions
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
              Type
            </TableCell>
            <TableCell>
              State
            </TableCell>
            <TableCell>
              Created
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {project.extensions.map(extension => {
            let stateIcon = <CircularProgress size={25} />
            if(extension.state === "complete"){
              stateIcon = <ExtensionStateCompleteIcon size={25}/>
            }
            if(extension.state === "failed"){
              stateIcon = <ExtensionStateFailedIcon />
            }            
            return (
            <TableRow
              hover
              onClick={event => this.openExtensionDrawer(event, extension)}
              tabIndex={-1}
              key={extension.id}>
              <TableCell> { extension.extension.name } </TableCell>
              <TableCell> { extension.extension.type } </TableCell>
              <TableCell> { stateIcon } </TableCell>
              <TableCell> { new Date(extension.created).toDateString() }</TableCell>
            </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Paper>
    )
  }

  renderExtensionsDrawer() {
    if (!this.state.extensionDrawer.extension) {
      return null 
    }
    
    let CustomForm = this.state.extensionDrawer.customForm
    let { extension } = this.state.extensionDrawer
    
    let name = extension.name
    let type = extension.type
    let config = []
    
    if(extension.__typename === "Extension"){
      const ext = extension
      name = ext.name
      type = ext.type
      ext.config.map(function(obj){
          let _obj = _.find(ext.config.config, {key: obj.key, value: obj.value });
          if (_obj) {
              config.push(_obj) 
          } else {
              config.push(obj) 
          }
          return null
      })
    } else if(extension.__typename === "ProjectExtension"){
        config = []
        name = extension.extension.name
        type = extension.extension.type
        extension.config.config.map(function(obj){
          let _obj = _.clone(obj)
          _obj.value = obj.value
          config.push(_obj) 
          return null
        })
    }

    const fields = [
      'config[]',
      'config[].key',
      'config[].value',
    ];
    const rules = {};
    const labels = {};
    const initials = {};
    const types = {};
    const extra = {};
    const hooks = {};
    const handlers = {};
    const plugins = { dvr: validatorjs };
    this.form = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { handlers }, { plugins })
    this.form.update({ config: config })

    const secretOptions = this.props.data.project.secrets.map(function(secret){
      return {
        key: secret.id,
        value: "(" + secret.key + ") => " + secret.value,
      }
    })

    this.form.state.extra({
      config: secretOptions,
    })

    
    let config_jsx = this.form.$('config').map((obj) => {
      return (
        <Grid key={obj.key} item xs={12}>
          <EnvVarSelectField field={obj.$('value')} fullWidth={true} extraKey="config" label={config[obj.key].key} />
        </Grid>
      )
    })

    return (<div className={styles.createServiceBar}>
      <AppBar position="static" color="default">
        <Toolbar>
          <Typography variant="title" color="inherit">
            { name } extension ({ type })
          </Typography>
        </Toolbar>
      </AppBar>
      <div className={styles.drawerBody}>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <Typography variant="subheading"><b>Config</b></Typography>
            <br/>
            {config_jsx}
          </Grid>

          <Grid item xs={12}>
            { CustomForm && <CustomForm type={this.state.extensionDrawer.formType} key={extension.id} init={extension.config.custom} onRef={ref => (this.customForm = ref)} {...this.props} /> }
          </Grid>

          {extension.stateMessage &&
            <Grid item xs={12}>
              <Typography variant="title">
                  Status
              </Typography> 
              <Typography variant="subheading">
                  {extension.stateMessage}
              </Typography>                 
            </Grid>
          }
          
          {extension.artifacts &&
            <Grid item xs={12}>
              <Paper>
                <Toolbar>
                  <div> <Typography variant="title">
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
                    {Object.keys(extension.artifacts).map(key => {
                      return (
                      <TableRow>
                        <TableCell> { key } </TableCell>
                        <TableCell> { extension.artifacts[key] } </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          }

          <Grid item xs={12}>
            <Button variant="raised" color="primary" className={styles.rightPad}
              onClick={(event) => this.saveExtension(event)}
            >
              Save
            </Button>
            { extension.extension && <Button
              onClick={() => this.setState({ dialogOpen: true })}
              style={{ color: "red" }}
            >
              Delete
            </Button> }
            <Button color="primary"
              onClick={this.closeExtensionDrawer.bind(this)}
            >
              Cancel
            </Button>
          </Grid>
        </Grid>
      </div>
    </div>
    )
  }
}
