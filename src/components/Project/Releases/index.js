import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import { CircularProgress } from 'material-ui/Progress';
import Card, { CardContent } from 'material-ui/Card';
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
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import MobxReactForm from 'mobx-react-form';

class ReleaseView extends React.Component {
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
        <Card className={this.props.showFullView === false ? styles.feature : styles.fullFeature } variant="raised" disabled={this.props.showFullView}>
          <CardContent>
            <Typography className={styles.featureCommitMsg}>
              <ForkIcon />
              { this.props.release.headFeature.hash }
              <DoubleRightIcon />
              { this.props.release.tailFeature.hash }
            </Typography>
            <br/>
            <Typography>
              { this.props.release.headFeature.message}
            </Typography>
            <Typography component="p" className={styles.featureAuthor}>
              by <b> { this.props.release.headFeature.user } </b> - { new Date(this.props.release.created).toString() }
            </Typography>
            <br/>
            <Grid item xs={12}>
              {releaseStateIcon}
              <Typography variant="subheading">
                {this.props.release.releaseExtensions.filter(re => re.state === "complete").length} / {this.props.release.releaseExtensions.length}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subheading">
                {this.props.release.stateMessage}
              </Typography>
            </Grid>            
          </CardContent>
        </Card>
      </Grid>
    );
  }
}

@inject("store") @observer
@graphql(gql`
  query Project($slug: String, $environmentId: String){
    project(slug: $slug, environmentId: $environmentId) {
      id
      name
      slug
      rsaPublicKey
      gitProtocol
      gitUrl
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
                extensionSpec {
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
              extensionSpec {
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
      environmentId: props.store.app.currentEnvironment.id,
    }
  })
})

@graphql(gql`
mutation Mutation($id: String, $headFeatureId: String!, $projectId: String!, $environmentId: String!) {
  createRelease(release: { id: $id, headFeatureId: $headFeatureId, projectId: $projectId, environmentId: $environmentId }) {
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
        variables: { id: release.id, headFeatureId: release.headFeature.id, projectId: release.project.id, environmentId: release.environment.id },
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

    if(loading){
      return (<div>Loading...</div>);
    }
    return (
      <div>
        <Grid container spacing={16}>
          <Grid item xs={12} className={styles.title}>
            <Typography variant="subheading">
              <b> Current Release </b>
            </Typography>
          </Grid>
          <Grid item xs={12} className={styles.feature}>
          {project.currentRelease != null &&
            <ReleaseView
            key={project.currentRelease.id}
            release={project.currentRelease}
            handleOnClick={() => this.handleToggleDrawer(-1)}
            showFullView={this.state.showCurrentReleaseFullView}
            />}
          </Grid>
        </Grid>
        <Grid container spacing={16}>
          <Grid item xs={12} className={styles.title}>
            <Typography variant="subheading">
              <b> Releases </b>
            </Typography>
          </Grid>
          <Grid item xs={12} className={styles.feature}>
            {[...Array(project.releases.length)].map((x, i) =>
              <ReleaseView
                key={project.releases[i].id}
                release={project.releases[i]}
                handleOnClick={() => this.handleToggleDrawer(i)}
                showFullView={this.state.activeFeatureKey === i} />
            )}
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
                    <Typography variant="body2">
                    <b> head </b> : {project.releases !== undefined &&
                      project.releases[this.form.values()['index']] &&
                      project.releases[this.form.values()['index']].headFeature.hash }
                    </Typography>
                    <Typography variant="body2">
                    <b> tail </b> : {project.releases !== undefined &&
                      project.releases[this.form.values()['index']] &&
                      project.releases[this.form.values()['index']].tailFeature.hash }
                    </Typography>
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
                                <TableCell> { re.extension.extensionSpec.name } </TableCell>
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
