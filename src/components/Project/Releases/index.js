import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import { CircularProgress } from 'material-ui/Progress';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Grid from 'material-ui/Grid';
import ForkIcon from 'react-icons/lib/fa/code-fork';
import DoubleRightIcon from 'react-icons/lib/fa/angle-double-right';
import { withTheme } from 'material-ui/styles';

import ExtensionStateCompleteIcon from 'material-ui-icons/CheckCircle';
import ReleaseStateCompleteIcon from 'material-ui-icons/CloudDone';

const inlineStyles = {
    extensionLogs: {
        background: "black",
        color: "white",
        fontSize: 12,
        padding: 10,
        fontFamily: 'monospace',
        minHeight: 250,
        overflow: 'scroll',
    }
}

const DEFAULT_RELEASE_EXTENSION_LOG = {
    id: -1,
    msg: "first!",
}

const DEFAULT_RELEASE_EXTENSION = {
    id: -1,
    logs: [
        DEFAULT_RELEASE_EXTENSION_LOG,
    ],
    extension: {
        extensionSpec: {
            name: "Default"
        },
    },
    state: "waiting",
    stateMessage: "initialized",
}

const DEFAULT_RELEASE = {
    id: -1,
    headFeature: "",
    tailFeature: "",
    releaseExtensions: [
        DEFAULT_RELEASE_EXTENSION,
    ],
}

@inject("store") @observer

class ReleaseView extends React.Component {
  componentDidMount(){
  }

  render() {
    let releaseStateIcon = <CircularProgress size={25} />
    if(this.props.release.state === "complete"){
        releaseStateIcon = <ReleaseStateCompleteIcon color={'green'} />
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
  };

  handleToggleDrawer(releaseIdx){
    let deployAction = 'Rollback'
    if(releaseIdx === 0 && this.props.project.releases[0].state === "complete"){
        deployAction = 'Redeploy'
    }

    if(releaseIdx === -1){
        for(var i = 0; i < this.props.project.releases.length; i++){
            let release = this.props.project.releases[i]
            deployAction = 'Redeploy'
            if(release.state === "complete"){
                releaseIdx = i;
                break;
            }
        }
    }
    this.setState({ open: true, dialogOpen: false, currentRelease: releaseIdx, deployAction: deployAction })
  }

  render() {

    const { project } = this.props;
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
          open={this.state.open}
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
                    <b> head </b> : {project.releases !== undefined && project.releases.length > 0 && project.releases[this.state.currentRelease].headFeature.hash }
                    </Typography>
                    <Typography type="body2">
                    <b> tail </b> : {project.releases !== undefined && project.releases.length > 0 && project.releases[this.state.currentRelease].tailFeature.hash }
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
                          {project.releases !== undefined && this.props.project.releases.length > 0 && this.props.project.releases[this.state.currentRelease].releaseExtensions.map(re => {
                            let stateIcon = <CircularProgress size={25} />
                            if(re.state === "complete"){
                                stateIcon = <ExtensionStateCompleteIcon />
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
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Button
                      raised
                      disabled={project.releases.length > 0 && project.releases[this.state.currentRelease].state !== "complete"}
                      color="primary"
                      onClick={()=>this.setState({ open: false }) }>
                      { this.state.deployAction }
                    </Button>
                    <Button
                      color="primary"
                      onClick={()=>this.setState({ open: false }) }>
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
