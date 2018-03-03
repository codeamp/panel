import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import { CircularProgress } from 'material-ui/Progress';
import Card, { CardHeader, CardContent } from 'material-ui/Card';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Grid from 'material-ui/Grid';
import ForkIcon from 'react-icons/lib/fa/code-fork';
import DoubleRightIcon from 'react-icons/lib/fa/angle-double-right';
import ExtensionStateCompleteIcon from 'material-ui-icons/CheckCircle';
import ExtensionStateFailedIcon from 'material-ui-icons/Error';
import ReleaseStateCompleteIcon from 'material-ui-icons/CloudDone';
import ReleaseStateFailedIcon from 'material-ui-icons/Error';
import Loading from 'components/Utils/Loading';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import MobxReactForm from 'mobx-react-form';

class ReleaseView extends React.Component {
  renderReleaseExtensionStatuses() {
    const { release, extensions } = this.props;
    // filter out 'once' types
    const filteredExtensions = extensions.filter(function(extension){
      if(extension.extension.type === "once") {
        return false
      } 
      return true
    })
    console.log(release.releaseExtensions)
    const projectExtensionLights = filteredExtensions.map(function(extension){
      for(var i = 0; i < release.releaseExtensions.length; i++){
        console.log(release.releaseExtensions[i].extension.id, extension.id)
        if(release.releaseExtensions[i].extension.id === extension.id){
          // get state { waiting => yellow, failed => red, complete => green}
          switch(release.releaseExtensions[i].state){  
            case "waiting":
            return (<div className={styles.innerWaiting}></div>)
            case "complete":
            return (<div className={styles.innerComplete}></div>)
            case "failed":
            return (<div className={styles.innerFailed}></div>)                        
          }
        }
      }
      return (<div className={styles.innerNotStarted}></div>)
    })
    
    return (
      <div style={{ display: "inline-block" }}>
        { projectExtensionLights }
      </div>
    )
  }
  render() {
    let releaseStateIcon = <CircularProgress size={25} />
    if(this.props.release.state === "complete"){
        releaseStateIcon = <ReleaseStateCompleteIcon color={'green'} />
    }
    if(this.props.release.state === "failed"){
        releaseStateIcon = <ReleaseStateFailedIcon color={'red'} />
    }
    return (
      <Grid item xs={12} onClick={this.props.handleOnClick}>
        <Card disabled={this.props.showFullView} square={true} style={{ paddingBottom: 0 }}>
          <CardContent>
            <Typography className={styles.featureCommitMsg}>
              { this.props.release.headFeature.hash.slice(30) }
              <DoubleRightIcon />
              { this.props.release.tailFeature.hash.slice(30) }
            </Typography>
            <Typography>
              { this.props.release.headFeature.message}
            </Typography>
            <Typography component="p" className={styles.featureAuthor}>
              by <b> { this.props.release.headFeature.user } </b> - { new Date(this.props.release.created).toDateString() }
            </Typography>
            <div className={styles.statusLights}>
              {this.renderReleaseExtensionStatuses()}
            </div>
          </CardContent>
        </Card>
      </Grid>
    );
  }
}

@inject("store") @observer
@graphql(gql`
  query Project($slug: String, $environmentID: String){
    project(slug: $slug, environmentID: $environmentID) {
      id
      name
      slug
      rsaPublicKey
      gitProtocol
      gitUrl
      extensions {
        id
        extension {
          id
          name
          type
        }
      }
      currentRelease {
        id
        state
        stateMessage
        project {
          id
        }
        environment {
          id
        }
        releaseExtensions {
          id
          extension {
            id
            extension {
              id
              name
            }
          }
          state
          stateMessage
        }
        created
        user {
          email
        }
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
      }
      releases {
        id
        artifacts
        state
        stateMessage
        created
        user {
          email
        }
        project {
          id
        }
        environment {
          id
        }        
        releaseExtensions {
          id
          artifacts
          extension {
            id
            extension {
              id
              name
            }
          }
          type
          state
          stateMessage
        }
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
      }
    }
  }
`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.store.app.currentEnvironment.id,
    },
  })
})

@graphql(gql`
mutation Mutation($id: String, $headFeatureID: String!, $projectID: String!, $environmentID: String!) {
  createRelease(release: { id: $id, headFeatureID: $headFeatureID, projectID: $projectID, environmentID: $environmentID }) {
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
mutation Mutation($releaseId: ID!) {
  rollbackRelease(releaseId: $releaseId) {
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
`, { name: "rollbackRelease" })

export default class Releases extends React.Component {
  state = {
    activeStep: 0,
    showCurrentReleaseFullView: false,
    currentRelease: 0,
    dockerBuilderLogs: "No logs yet...",
    deployAction: '',
  };

  handleNext = () => {
    this.setState({
      activeStep: this.state.activeStep + 1,
    });
  };

  handleBack = () => {
    this.setState({
      activeStep: this.state.activeStep - 1,
    });
  };

  componentWillMount() {    
    this.props.data.refetch()
    this.setupSocketHandlers()    

    const fields = [
      'id',
      'index',
    ];
    const rules = {};
    const labels = {};
    const initials = {}
    const types = {};
    const keys = {};
    const disabled = {}
    const extra = {};
    const hooks = {};
    const plugins = {};

    this.form = new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys }, { plugins });
  };

  setupSocketHandlers(){
    const { socket, match } = this.props;
    
    socket.on(match.url.substring(1, match.url.length), (data) => {
      this.props.data.refetch()
    });    
    
    socket.on(match.url.substring(1, match.url.length) + '/reCompleted', (data) => {
      this.props.data.refetch()
    });        
  }


  handleToggleDrawer(releaseIdx){
    let deployAction = 'Rollback'
    if(releaseIdx === 0 && this.props.data.project.releases[0].state === "complete"){
        deployAction = 'Redeploy'
    }

    if(releaseIdx === -1){
        for(var i = 0; i < this.props.data.project.releases.length; i++){
            let release = this.props.data.project.releases[i]
            deployAction = 'Redeploy'
            if(release.state === "complete"){
                releaseIdx = i;
                break;
            }
        }
    }

    this.form.$('index').set(releaseIdx)
    this.form.$('id').set(this.props.data.project.releases[releaseIdx].id)

    this.setState({ drawerOpen: true, dialogOpen: false, currentRelease: releaseIdx, deployAction: deployAction })
  }

  releaseAction(){
    const { deployAction } = this.state;
    const { rollbackRelease, createRelease } = this.props;
    const { project, refetch } = this.props.data;
    const release = project.releases[this.form.values()['index']];

    if(deployAction === 'Rollback') {
      rollbackRelease({variables: { releaseId: release.id }}).then(function(res){
        refetch()
      }).catch(function(err){
        refetch()
      })
    } else if(deployAction === 'Redeploy') {
      createRelease({
        variables: { id: release.id, headFeatureID: release.headFeature.id, projectID: release.project.id, environmentID: release.environment.id },
      }).then(({data}) => {
        refetch()
      }).catch(function(err){
        refetch()
      });
    }
    this.closeDrawer()
  }

  closeDrawer(){
    this.setState({ drawerOpen: false })
  }

  componentWillUpdate(nextProps, nextState){
    nextProps.data.refetch()
  }

  render() {
    const { loading, project } = this.props.data;
    console.log(this.props.data)

    if(loading){
      return (<Loading />)
    }
    return (
      <div>
        <Grid container spacing={16}>
          <Grid item xs={12} className={styles.feature}>
            <Card square={true}>
              <CardContent>
                <Typography variant="title">
                  Current Release
                </Typography>
              </CardContent>
            </Card>              
            {project.currentRelease ?
              <ReleaseView
                key={project.currentRelease.id}
                extensions={project.extensions}
                release={project.currentRelease}
                handleOnClick={() => this.handleToggleDrawer(-1)}
                showFullView={this.state.showCurrentReleaseFullView}
              /> :
              <Card square={true}>
                <CardContent>
                  <Typography variant="body1" style={{ textAlign: "center", fontSize: 16, color: "gray" }}>
                    This project has no deployed releases yet.
                  </Typography>
                </CardContent>
              </Card>                          
              }
          </Grid>
        </Grid>
        <Grid container spacing={16}>
          <Grid item xs={12} className={styles.feature}>
            <Card square={true}>
              <CardContent>
                <Typography variant="title">
                  Releases
                </Typography>
              </CardContent>
            </Card>
            {project.releases.length > 0 ?
              [...Array(project.releases.length)].map((x, i) =>
                <ReleaseView
                  key={project.releases[i].id}
                  extensions={project.extensions}
                  release={project.releases[i]}
                  handleOnClick={() => this.handleToggleDrawer(i)}
                  showFullView={this.state.activeFeatureKey === i} />
              )
              :
              <Card square={true}>
                <CardContent>
                  <Typography variant="subheading" style={{ textAlign: "center", fontWeight: 500, fontSize: 23, color: "gray" }}>
                    There are no releases.
                  </Typography>
                  <Typography variant="body1" style={{ textAlign: "center", fontSize: 16, color: "gray" }}>
                  Do some work and deploy a feature <strong><a href={"/projects/" + project.slug + "/features"}>here.</a></strong>
                  </Typography>                  
                </CardContent>
              </Card>                          
              }
            </Grid>
        </Grid>
        <Drawer
          anchor="right"
          classes={{
            paper: styles.drawer
          }}
          open={this.state.drawerOpen}
        >
            <div className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                <Toolbar>
                  <Typography variant="title" color="inherit">
                    Release Information
                  </Typography>
                </Toolbar>
              </AppBar>
              <Grid container spacing={24} className={styles.grid}>
                <Grid item xs={12}>
                  <Card square={true}>
                    <CardContent>
                      <Typography variant="title">
                        Git Info
                      </Typography>
                    </CardContent>
                  </Card>                       
                  <Card square={true}>
                    <CardContent>                                     
                      <Typography variant="body1">
                        <b>HEAD</b> : {project.releases !== undefined && project.releases[this.form.values()['index']] && project.releases[this.form.values()['index']].headFeature.hash }
                      </Typography>                  
                    </CardContent>
                  </Card>                  
                  <Card square={true}>
                    <CardContent>                                               
                      <Typography variant="body1">
                        <b>TAIL</b> : {project.releases !== undefined && project.releases[this.form.values()['index']] && project.releases[this.form.values()['index']].tailFeature.hash }
                      </Typography>                                  
                    </CardContent>
                  </Card>                                    
                </Grid>
                <Grid item xs={12}>                
                  <Paper className={styles.root}>
                    <div className={styles.tableWrapper}>
                      <Toolbar>
                        <div>
                          <Typography variant="title">
                            Extensions
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
                              State
                            </TableCell>
                            <TableCell>
                              Message
                            </TableCell>
                            <TableCell>
                              Type
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {project.releases !== undefined && project.releases.length > 0 && project.releases[this.form.values()['index']] && project.releases[this.form.values()['index']].releaseExtensions.map(re => {
                            let stateIcon = <CircularProgress size={25} />
                            if(re.state === "complete"){
                                stateIcon = <ExtensionStateCompleteIcon />
                            }
                            if(re.state === "failed"){
                                stateIcon = <ExtensionStateFailedIcon />
                            }
                            return (
                              <TableRow
                                tabIndex={-1}
                                key={re.id}>
                                <TableCell> { re.extension.extension.name } </TableCell>
                                <TableCell> { stateIcon } </TableCell>
                                <TableCell>
                                    {re.stateMessage}
                                </TableCell>
                                <TableCell>
                                    {re.type}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </Paper>
                </Grid>
                {project.releases !== undefined && project.releases.length > 0 && project.releases[this.form.values()['index']] && Object.keys(project.releases[this.form.values()["index"]].artifacts).length > 0 &&
                    <Grid item xs={12}>                
                      <Paper className={styles.root}>
                        <div className={styles.tableWrapper}>
                          <Toolbar>
                            <div>
                              <Typography variant="title">
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
                              {project.releases !== undefined && project.releases.length > 0 && project.releases[this.form.values()['index']] && Object.keys(project.releases[this.form.values()['index']].artifacts).map(artifactKey => {
                                return (
                                      <TableRow
                                        tabIndex={-1}
                                        key={this.form.values()['index'] + "-" + artifactKey}>
                                        <TableCell>
                                            {artifactKey}
                                        </TableCell>
                                        <TableCell>
                                            {project.releases[this.form.values()["index"]].artifacts[artifactKey]}
                                        </TableCell>
                                      </TableRow>
                                  )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </Paper>
                    </Grid>
                }
                <Grid item xs={12}>
                  {project.releases[this.form.values()['index']] &&
                   project.releases[this.form.values()['index']].state === "complete" &&
                    <Button
                      variant="raised"
                      disabled={project.releases.length > 0 && project.currentRelease && project.currentRelease.state !== "complete"}
                      color="primary"
                      onClick={this.releaseAction.bind(this)}>
                      { this.state.deployAction }
                    </Button>
                  }
                    <Button
                      color="primary"
                      onClick={()=>this.setState({ drawerOpen: false }) }>
                      Cancel
                    </Button>
                </Grid>
              </Grid>
            </div>
        </Drawer>
      </div>
    );
  }
}
