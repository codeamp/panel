import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import Card, { CardContent } from 'material-ui/Card';
import AppBar from 'material-ui/AppBar';
import Link from 'react-router-dom/Link';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import InputField from 'components/Form/input-field';
import Checkbox from 'material-ui/Checkbox';
import { FormControlLabel } from 'material-ui/Form';
import Loading from 'components/Utils/Loading';
import styles from './style.module.css';
import { observer, inject } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { check } from 'graphql-anywhere';
import _ from 'lodash';

@graphql(gql`
  query AllProjects($projectSearch: ProjectSearchInput){
    projects(projectSearch: $projectSearch){
      id
      name
      slug
      environments {
        id
      }
    }
    extensions {
      id
      key
      name
      environment {
        id
        name
        key
      }
    }
    environments {
      id
      name
      key
      color
      projects {
        id
        releases {
          id
          state
          headFeature {
            id
            message
            user
            hash
            parentHash
            ref
            created
          }
          tailFeature {
            id
            message
            user
            hash
            parentHash
            ref
            created
          } 
          releaseExtensions {
            id
            state
            extension {
              id
              extension {
                id
                key
                name
              }
            }
          }         
        }
        extensions {
          id
          state
          config
          customConfig
          artifacts
          extension {
            id
            key
            name
          }  
        }      
      }
    }
  }
`, {
	options: (props) => ({
    fetchPolicy: "cache-and-network",
		variables: {
			projectSearch: {
				repository: "",
        bookmarked: false,
      },
    },
	})
})

@graphql(gql`
mutation Mutation($headFeatureID: String!, $projectID: String!, $environmentID: String!, $forceRebuild: Boolean!) {
  createRelease(release: { headFeatureID: $headFeatureID, projectID: $projectID, environmentID: $environmentID, forceRebuild: $forceRebuild }) {
    headFeature {
      message
    }
    tailFeature  {
      message
    }
    state
    stateMessage
  }
}
`, { name: "createRelease" })

@graphql(gql`
  mutation UpdateProjectExtension ($id: String, $projectID: String!, $extensionID: String!, $config: JSON!, $customConfig: JSON!, $environmentID: String!) {
      updateProjectExtension(projectExtension:{
        id: $id,
        projectID: $projectID,
        extensionID: $extensionID,
        config: $config,
        customConfig: $customConfig,
        environmentID: $environmentID,
      }) {
          id
      }
}
`, { name: "updateProjectExtension" })

@inject("store") @observer
export default class Projects extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      saving: false,
      drawerOpen: false,
      dialogOpen: false,
      checkedProjects: [],
      checkedEnvs: [],
      checkedExtensions: [],
    }
    
    const { socket, match } = this.props;    

    socket.on(match.url.substring(1, match.url.length), (data) => {
      this.props.data.refetch()
    });    
    
    socket.on(match.url.substring(1, match.url.length) + '/reCompleted', (data) => {
      this.props.data.refetch()
    });            
  }

  onSubmit(e) {
    this.setState({ saving: true })
    this.onSuccess(this.form)
  }

  openDrawer(){
    this.setState({ drawerOpen: true, saving: false });
  }

  closeDrawer(){
    this.form = null
    this.setState({ drawerOpen: false, saving: false, dialogOpen: false })
  }

  selectAllProjects(e){
    const allProjects = this.props.data.projects.map(function(project){
      return project.id
    })
    if(e.target.checked){
      this.setState({ checkedProjects: allProjects })
    } else {
      this.setState({ checkedProjects: [] })
    }
  }

  toggleCheckedProject(project) {
    let checkedProjects = this.state.checkedProjects
    if(checkedProjects.includes(project.id)){
      checkedProjects.splice(checkedProjects.indexOf(project.id), 1)
    } else {
      checkedProjects.push(project.id)
    }

    this.setState({ checkedProjects: checkedProjects })
  }
  
  toggleCheckedEnv(env) {
    let checkedEnvs = this.state.checkedEnvs
    if(checkedEnvs.includes(env.id)){
      checkedEnvs.splice(checkedEnvs.indexOf(env.id), 1)
    } else {
      checkedEnvs.push(env.id)
    }

    this.setState({ checkedEnvs: checkedEnvs })
  }
  
  toggleCheckedExtension(extension) {
    let checkedExtensions = this.state.checkedExtensions
    if(checkedExtensions.includes(extension.id)){
      checkedExtensions.splice(checkedExtensions.indexOf(extension.id), 1)
    } else {
      checkedExtensions.push(extension.id)
    }

    this.setState({ checkedExtensions: checkedExtensions })
  }

  onBatchDeploy(route53Deploy){
    const { environments, projects } = this.props.data;

    var self = this
    this.state.checkedProjects.forEach(function(projectID){
      let project = {}
      self.props.data.projects.map(function(tmpProject){
        if(tmpProject.id === projectID) {
          project = tmpProject
        }
      })

      project.environments.map(function(env){
        let _environment = _.find(environments, {id: env.id})
        let _project = _.find(_environment.projects, {id: project.id})

        let currentRelease = null
        for(var i = 0; i < _project.releases.length; i++) {
          let release = _project.releases[i]
          if(release.state === "complete"){
            currentRelease = release
            break
          }
        }
        
        if(self.state.checkedEnvs.includes(env.id) && currentRelease !== null){
          console.log('deploying ' + _project.name + ' in env ' + _environment.key + ' with head feature ' + currentRelease.headFeature.hash)
          self.props.createRelease({
            variables: { 
              headFeatureID: currentRelease.headFeature.id, 
              projectID: projectID, 
              environmentID: _environment.id,
              forceRebuild: true,
            },
          }).then(({data}) => {
            // find checked extensions for that env
            self.props.data.refetch()
            _project.extensions.map(function(projectExtension){
              if(self.state.checkedExtensions.includes(projectExtension.extension.id)) {
                console.log('updating project extension ' + projectExtension.extension.name)
                console.log({
                  id: projectExtension.id,
                  projectID: projectID,
                  extensionID: projectExtension.extension.id,
                  config: projectExtension.config,
                  customConfig: projectExtension.customConfig,
                  environmentID: _environment.id,
                })
                self.props.updateProjectExtension({
                  variables: {
                    id: projectExtension.id,
                    projectID: projectID,
                    extensionID: projectExtension.extension.id,
                    config: projectExtension.config,
                    customConfig: projectExtension.customConfig,
                    environmentID: _environment.id,
                  }
                }).then(({data}) => {
                  self.props.data.refetch()
                })
              }
            })            
          });      
        }
      })
    })
  }
  
  render() {
    const { loading, projects, environments, extensions } = this.props.data;

    if(loading || !projects || !environments || !extensions){
      return (
        <Loading />
      )
    }

    var runningReleases = 0
    var completeReleases = 0
    var failedReleases = 0

    environments.map(function(env){
      let _environment = _.find(environments, { id: env.id })
      projects.map(function(project){
        let _project = _.find(_environment.projects, { id: project.id })
        console.log(_project)
        if(_project !== undefined) {
          if(_project.releases.length > 0){
            switch(_project.releases[0].state){
              case "complete":
                completeReleases += 1
                break;
              case "failed":
                failedReleases += 1
                break;
              case "waiting":
                runningReleases += 1
                break;
              case "fetching":
                runningReleases += 1
                break;
            }
          }
        }
      })
    })    

    var self = this;
    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <div>
              <Typography variant="title">
                Projects
              </Typography>
              <Typography>
                no releases &nbsp;
                <svg height="10" width="10">
                  <circle cx="25" cy="25" r="40" fill="black" />
                </svg> &nbsp;&nbsp;&nbsp;

                complete &nbsp;
                <svg height="10" width="10">
                  <circle cx="25" cy="25" r="40" fill="green" />
                </svg> &nbsp;&nbsp;&nbsp;
                
                failed &nbsp;
                <svg height="10" width="10">
                  <circle cx="25" cy="25" r="40" fill="red" /> 
                </svg> &nbsp;&nbsp;&nbsp;                             

                not started &nbsp;
                <svg height="10" width="10">
                  <circle cx="25" cy="25" r="40" fill="lightgray" />
                </svg> &nbsp;&nbsp;&nbsp;

                running &nbsp;
                <svg height="10" width="10">
                  <circle cx="25" cy="25" r="40" fill="yellow" />
                </svg>                                                
              </Typography>
            </div>

            <br/>

            <Grid container spacing={24}>
              <Grid item xs={3}>
                <Card>
                  <CardContent>
                    <Typography variant="headline" component="h2" className={styles.title}>
                      Total
                    </Typography>
                    <Typography variant="display2" className={styles.bigNumber}>
                      {projects.length}
                    </Typography>
                  </CardContent>
                </Card>        
              </Grid>

              <Grid item xs={3}>
                <Card className={styles.completeReleasesCard}>
                  <CardContent>
                    <Typography variant="headline" component="h2" className={styles.title}>
                      Complete
                    </Typography>
                    <Typography variant="display2" className={styles.bigNumber}>
                      {completeReleases}
                    </Typography>
                  </CardContent>
                </Card>        
              </Grid>

              <Grid item xs={3}>
                <Card className={styles.runningReleasesCard}>
                  <CardContent>
                    <Typography variant="headline" component="h2" className={styles.title}>
                      Running
                    </Typography>
                    <Typography variant="display2" className={styles.bigNumber}>
                      {runningReleases}
                    </Typography>
                  </CardContent>
                </Card>        
              </Grid>            

              <Grid item xs={3}>
                <Card className={styles.failedReleasesCard}>
                  <CardContent>
                    <Typography variant="headline" component="h2" className={styles.title}>
                      Failures
                    </Typography>
                    <Typography variant="display2" className={styles.bigNumber}>
                      {failedReleases}
                    </Typography>
                  </CardContent>
                </Card>        
              </Grid> 
            </Grid>     

          </Toolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Checkbox
                    onClick={(e) => {this.selectAllProjects(e)} }
                  />
                </TableCell>
                <TableCell>
                  Name
                </TableCell>
                <TableCell>
                  Statuses
                </TableCell>                
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map(function(project, idx){
                return (
                  <TableRow
                    tabIndex={-1}
                    key={project.name}>
                    <TableCell>
                      <Checkbox 
                        onClick={() => {self.toggleCheckedProject(project)} }
                        checked={ self.state.checkedProjects.includes(project.id) } />
                    </TableCell>
                    <TableCell>
                      <Link to={"/projects/" + project.slug}>
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {project.environments.map(function(env){
                        // get env in environments query
                        let _environment = _.find(environments, { id: env.id })
                        let _project = _.find(_environment.projects, { id: project.id })
                        
                        let color = "lightgray"
                        let extensionStatuses = []                        
                        if(_project.releases.length > 0) {
                          switch(_project.releases[0].state){
                            case "complete":
                              color = "green"
                              break;
                            case "waiting":
                              color = "yellow"
                              break;                              
                            case "failed":
                              color = "red"
                              break;
                          }

                          _project.releases[0].releaseExtensions.map(function(releaseExtension){
                            let status = "lightgray"
                            switch(releaseExtension.state){
                              case "complete":
                                status = "green"
                                break;
                              case "waiting":
                                status = "yellow"
                                break;       
                              case "fetching":
                                status = "yellow"
                                break;                                                              
                              case "failed":
                                status = "red"
                                break;
                            }                  
                            extensionStatuses.push(
                              <span key={releaseExtension.id} style={{ border: "2px solid black", margin: 4, backgroundColor: status, padding: 5, fontWeight: "normal" }}>
                                {releaseExtension.extension.extension.key}
                              </span>
                            )
                          })
                        }

                        return (
                          <div key={env.id + project.id} style={{ backgroundColor: color, padding: 10, border: "1px solid black", margin: 4, textAlign: "center", fontWeight: "bold" }}>
                            <Link to={"/projects/" + _project.slug + "/" + _environment.key}>
                              {_environment.name + "(" + _environment.key + ")"} &nbsp;
                            </Link>                                                      
                            {extensionStatuses}                            
                          </div>
                        )
                      })}
                    </TableCell>  
                                      
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
        <Paper style={{ marginTop: 20, padding: 20 }}>
          <Grid container>
            <Grid item xs={12}>
              <Typography variant="display1">
                Deploy to selected environments:
              </Typography>
              {environments.map(function(env, idx){
                return (
                  <div key={env.id}>
                    <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox 
                              onClick={() => {self.toggleCheckedEnv(env)}}
                              checked={self.state.checkedEnvs.includes(env.id)} 
                            />
                          }
                          label={env.name + "(" + env.key + ")"} 
                        />    
                    </Grid> 
                    <Typography variant="body2">
                      <b>Available Extensions</b>
                    </Typography>
                    <Grid item xs={12}>
                      {extensions.map(function(extension){
                        if(extension.environment.id === env.id){
                          return (
                            <FormControlLabel
                              control={
                                <Checkbox 
                                  onClick={() => {self.toggleCheckedExtension(extension)}}
                                  checked={self.state.checkedExtensions.includes(extension.id)} 
                                />
                              }
                              label={extension.name + "(" + extension.key + ")"} 
                            />    
                          )
                        }
                      })}
                    </Grid>                    
                    <hr/>
                  </div>                               
                )
              })} 
            </Grid> 
          </Grid>   
          <br/><br/>
          <Button 
            onClick={this.onBatchDeploy.bind(this)}
            variant="raised" color="primary">
            Deploy All
          </Button>                  
        </Paper>
      </div>
    )
  }

}
