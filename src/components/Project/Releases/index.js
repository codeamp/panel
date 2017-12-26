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
        <Card className={this.props.showFullView === false ? styles.feature : styles.fullFeature } raised={this.props.showFullView}>
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
				<Typography type="subheading">
					{this.props.release.releaseExtensions.filter(re => re.state === "complete").length} / {this.props.release.releaseExtensions.length}
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
        state
        stateMessage
        created
        user {
          email
        }
        releaseExtensions {
            id
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
mutation Mutation($headFeatureId: String!, $projectId: String!, $environmentId: String!) {
  createRelease(release: { headFeatureId: $headFeatureId, projectId: $projectId, environmentId: $environmentId }) {
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

  shouldComponentUpdate(){
      return true
  }
  componentWillMount() {
    this.props.data.refetch()
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

  render() {
    const { loading, project } = this.props.data;
    if(loading){
      return (<div>Loading...</div>);
    }
    return (
      <div className={styles.root}>
        <Grid container spacing={16}>
          <Grid item xs={12} className={styles.title}>
            <Typography type="subheading">
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
            <Typography type="subheading">
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
          type="persistent"
          anchor="right"
          classes={{
            paper: styles.drawer
          }}
          open={this.state.drawerOpen}
        >
            <div className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                <Toolbar>

                  <Typography type="title" color="inherit">
                    Release Information
                  </Typography>
                </Toolbar>
              </AppBar>
              <Grid container spacing={24} className={styles.grid}>
                <Grid item xs={12}>
                    <Typography type="body2">
                    <b> head </b> : {project.releases !== undefined &&
                      project.releases[this.form.values()['index']] &&
                      project.releases[this.form.values()['index']].headFeature.hash }
                    </Typography>
                    <Typography type="body2">
                    <b> tail </b> : {project.releases !== undefined &&
                      project.releases[this.form.values()['index']] &&
                      project.releases[this.form.values()['index']].tailFeature.hash }
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Paper>
                      <Toolbar>
                        <div>
                          <Typography type="title">
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
                            console.log(re)

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
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                  {project.releases[this.form.values()['index']] &&
                   project.releases[this.form.values()['index']].state === "complete" &&
                    <Button
                      raised
                      disabled={project.releases.length > 0 && project.currentRelease && project.currentRelease.state !== "complete"}
                      color="primary"
                      onClick={()=>this.setState({ drawerOpen: false }) }>
                      { this.state.deployAction }
                    </Button>
                  }
                    <Button
                      color="primary"
                      onClick={()=>this.setState({ drawerOpen: false }) }>
                      Exit Panel
                    </Button>
                </Grid>
              </Grid>
            </div>
        </Drawer>
      </div>
    );
  }
}
