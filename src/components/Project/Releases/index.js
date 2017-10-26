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
    console.log("HELLO THERE")
  }

  render() {
    return (
      <Grid item xs={12} onClick={this.props.handleOnClick}>
        <Card className={this.props.showFullView === false ? styles.feature : styles.fullFeature } raised={this.props.showFullView}>
          <CardContent>
            <Typography className={styles.featureCommitMsg}>
              <ForkIcon />
              { this.props.release.headFeature.hash }
              <DoubleRightIcon />
              { this.props.release.tailFeature.hash } - { this.props.release.headFeature.message}
            </Typography>
            <Typography component="p" className={styles.featureAuthor}>
              by <b> { this.props.release.headFeature.user } </b> - { this.props.release.created }
            </Typography>
          </CardContent>
          <CardActions style={{ float: 'right', paddingRight: 35 }}>
            <Button raised color="primary" className={this.props.showFullView === false ? styles.hide : '' }>
              Rollback
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  }
}

export default class Releases extends React.Component {
  state = {
    activeStep: 0,
    showCurrentReleaseFullView: false,
    currentRelease: DEFAULT_RELEASE,
    dockerBuilderLogs: "No logs yet...",
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
    console.log(this.props.project);
  };

  handleToggleDrawer(release){
    console.log('handleToggleDrawer')
    console.log(release)
    this.setState({ open: !this.state.open, dialogOpen: false, currentRelease: release})
  }

  componentDidMount(){
    var self = this
this.props.socket.on("projects/" + this.props.variables.slug + "/releases/" + this.state.currentRelease+"log", (data) => {
      console.log('projects/' + this.props.variables.slug + '/releases/log', data);
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
          self.setState({ dockerBuilderLogs: self.state.dockerBuilderLogs + '\n\n\n' + data.log})
      }, 2000);
    })


  }

  render() {
    return (
      <div className={styles.root}>
        <Grid container spacing={16}>
          <Grid item xs={12} className={styles.title}>
            <Typography type="subheading">
              <b> Current Release </b>
            </Typography>
          </Grid>
          <Grid item xs={12} className={styles.feature}>
            <ReleaseView
            key={this.props.project.currentRelease.id}
            release={this.props.project.currentRelease}
            handleOnClick={() => this.setState({ showCurrentReleaseFullView: !this.state.showCurrentReleaseFullView })}
            showFullView={this.state.showCurrentReleaseFullView}
            />
          </Grid>
        </Grid>
        <Grid container spacing={16}>
          <Grid item xs={12} className={styles.title}>
            <Typography type="subheading">
              <b> Releases </b>
            </Typography>
          </Grid>
          <Grid item xs={12} className={styles.feature}>
            {[...Array(this.props.project.releases.length)].map((x, i) =>
              <ReleaseView
                key={this.props.project.releases[i].id}
                release={this.props.project.releases[i]}
                handleOnClick={() => this.handleToggleDrawer(this.props.project.releases[i])}
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
                    <b> head </b> : { this.state.currentRelease.headFeature.hash }
                    </Typography>
                    <Typography type="body2">
                    <b> tail </b> : { this.state.currentRelease.tailFeature.hash }
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Paper>
                      <Toolbar>
                        <div>
                          <Typography type="title">
                            Extension Statuses
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
                              Status
                            </TableCell>
                            <TableCell>
                              Info
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {this.state.currentRelease.releaseExtensions.map(re => {
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
                                <TableCell> </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </Paper>
                </Grid>

                {this.state.currentRelease.releaseExtensions.map(function(re){
                    return (
                        <Grid item xs={12}>
                            <Paper classes={{
                                root: styles.extensionReleaseView
                            }}>
                                <Typography type="subheading">
                                  { re.extension.extensionSpec.name }
                                </Typography>
                                <Grid item xs={12}>
                                    <Paper style={inlineStyles.extensionLogs}>
                                        {re.logs.map(function(log){
                                            return (
                                                <div>
                                                    { log.msg }
                                                </div>
                                            )
                                        })}
                                    </Paper>
                                </Grid>
                           </Paper>
                        </Grid>
                    )
                })}
              </Grid>
            </div>
        </Drawer>


      </div>
    );
  }
}
