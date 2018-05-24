import React from 'react';
import { observer, inject } from 'mobx-react';
import { NavLink } from 'react-router-dom';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import { CircularProgress } from 'material-ui/Progress';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Grid from 'material-ui/Grid';
import DoubleRightIcon from 'react-icons/lib/fa/angle-double-right';
import ExtensionStateCompleteIcon from 'material-ui-icons/CheckCircle';
import ExtensionStateFailedIcon from 'material-ui-icons/Error';
import Loading from 'components/Utils/Loading';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import MobxReactForm from 'mobx-react-form';
import _ from "lodash"
import Chip from 'material-ui/Chip';
import { FormControl } from 'material-ui/Form';
import Card, { CardContent } from 'material-ui/Card';
import TextField from 'material-ui/TextField';

const kibanaAppLogTemplate = process.env.REACT_APP_KIBANA_LINK_TEMPLATE
const kibanaReleaseLogTemplate = process.env.REACT_APP_KIBANA_RELEASE_TEMPLATE

function generateKibanaLink(linkTemplate, replacementHash) {
  for (const key in replacementHash) {
    let re = new RegExp(key,"g");
    linkTemplate = linkTemplate.replace(re, replacementHash[key])
  }

  return linkTemplate
}

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

    const projectExtensionLights = filteredExtensions.map(function(extension){
      for(var i = 0; i < release.releaseExtensions.length; i++){
        if(release.releaseExtensions[i].extension.id === extension.id){
          // get state { waiting => yellow, failed => red, complete => green}
          switch(release.releaseExtensions[i].state){  
            case "waiting":
              return (<Chip label={release.releaseExtensions[i].extension.extension.name} style={{ backgroundColor: "yellow", color: "black", marginRight: 4 }} />)
            break;
            case "complete":
              return (<Chip label={release.releaseExtensions[i].extension.extension.name} style={{ backgroundColor: "green", color: "white", marginRight: 4 }} />)
            break;
            case "failed":
              return (<Chip label={release.releaseExtensions[i].extension.extension.name} style={{ backgroundColor: "red", color: "white", marginRight: 4 }} />)               
            break;
            default:
              return (<Chip label={release.releaseExtensions[i].extension.extension.name} style={{ backgroundColor: "yellow", color: "black", marginRight: 4 }} />)
          }
        }
      }
      return null
    })
    
    return (
      <div style={{ display: "inline-block" }}>
        { projectExtensionLights }
      </div>
    )
  }

  render() {
    const { release, currentRelease } = this.props;
    
    let state
    switch(release.state) {  
      case "waiting":
        state = (<CircularProgress className={styles.progress} />)
      break;
      case "running":
        state = (<CircularProgress className={styles.progress} color="secondary" />)
      break;
      case "failed":
        state = (<Chip label="FAILED" style={{ backgroundColor: "red", color: "white" }} />)
      break;
      case "complete":
        if(currentRelease.id !== release.id){
          state = (<Chip label="SUCCEEDED" style={{ backgroundColor: "green", color: "white" }} />)
        }
      break;
      default:
        state = null
    }
    return (
      <Grid item xs={12} onClick={(e) => {this.props.handleOnClick(e)}}>
        <Card disabled={this.props.showFullView} square={true} style={{ paddingBottom: 0 }}>
          <CardContent>
            <Grid container spacing={0}>
              <Grid item xs={10}>
                <Typography className={styles.featureCommitMsg}>
                  { this.props.release.tailFeature.hash.substring(0, 8) }
                  <DoubleRightIcon />
                  { this.props.release.headFeature.hash.substring(0, 8) }
                </Typography>
                <Typography>
                  { this.props.release.headFeature.message}
                </Typography>
                <Typography component="p" className={styles.featureAuthor}>
                  by <b> { this.props.release.user !== null ? this.props.release.user.email : "Continuous Deploy" } </b> - { new Date(this.props.release.created).toString() }
                </Typography>
                <div className={styles.statusLights}>
                  {this.renderReleaseExtensionStatuses()}
                </div>
              </Grid>
              <Grid item xs={2} style={{textAlign: "right"}}> 
                {state}
                {_.has(currentRelease, 'id') && currentRelease.id === release.id && <Chip label="LATEST" className={styles.activeRelease} />}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    );
  }
}

@inject("store") @observer
@graphql(gql`
  query Project($slug: String, $environmentID: String){
    user {
      id
      email
      permissions
    }
    project(slug: $slug, environmentID: $environmentID) {
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
          key
        }
        releaseExtensions {
          id
          extension {
            id
            extension {
              id
              name
              type
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
          key
        }        
        releaseExtensions {
          id
          artifacts
          extension {
            id
            extension {
              id
              name
              type
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
mutation Mutation($id: String, $headFeatureID: String!, $projectID: String!, $environmentID: String!, $forceRebuild: Boolean!) {
  createRelease(release: { id: $id, headFeatureID: $headFeatureID, projectID: $projectID, environmentID: $environmentID, forceRebuild: $forceRebuild }) {
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
mutation StopRelease($id: ID!) {
  stopRelease(id: $id) {
    state
    stateMessage
  }
}
`, { name: "stopRelease" })

export default class Releases extends React.Component {
  state = {
    drawerRelease: null,
  };

  constructor(props) {
    super(props)
    this.props.data.refetch()

    const { socket, match } = this.props;
    
    socket.on(match.url.substring(1, match.url.length), (data) => {
      this.props.data.refetch()
    });    
    
    socket.on(match.url.substring(1, match.url.length) + '/reCompleted', (data) => {
      this.props.data.refetch()
    });        

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
  }

  static getDerivedStateFromProps(props, currentState) {
    if (currentState.drawerOpen && currentState.drawerRelease !== null) {
      for (let release of props.data.project.releases) {
        if (release.id === currentState.drawerRelease.id) {
          if (JSON.stringify(release) !== JSON.stringify(currentState.drawerRelease)) {
            currentState.drawerRelease = release
            return currentState
          }
        }
      }
    }
    return null
  }

  renderReleaseExtensionTable() {
		if (this.state.drawerRelease === null){
			return null
		}

    const release = this.state.drawerRelease
    const extensions = release.releaseExtensions.map(function(releaseExtension){
      return releaseExtension.extension
    })

    // filter out 'once' types
    const filteredExtensions = extensions.filter(function(extension){
        if(extension.extension.type === "once") {
            return false
        } 
        return true
    })

    const releaseExtensions = filteredExtensions.map(function(extension){
      let stateIcon = <CircularProgress size={25} /> 

      for(var i = 0; i < release.releaseExtensions.length; i++){
        if(release.releaseExtensions[i].extension.id === extension.id){
          if(release.releaseExtensions[i].state === "complete"){
              stateIcon = <ExtensionStateCompleteIcon />
          }
          if(release.releaseExtensions[i].state === "failed"){
              stateIcon = <ExtensionStateFailedIcon />
          }
          return (
            <TableRow
              tabIndex={-1}
              key={release.releaseExtensions[i].id}>
              <TableCell> { release.releaseExtensions[i].extension.extension.name } </TableCell>
              <TableCell> { stateIcon } </TableCell>
              <TableCell>
                  {release.releaseExtensions[i].stateMessage}
              </TableCell>
              <TableCell>
                  {release.releaseExtensions[i].type}
              </TableCell>
            </TableRow>)
          }
        }

        return null
    })
    
    return (
      <div>
        <Paper className={styles.root}>
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
              { releaseExtensions }
            </TableBody>
          </Table>
        </Paper>
      </div>
    )   
  }

  handleToggleDrawer(release, e){
    if(e.target.id !== "kibana-log-link"){
      this.setState({ drawerOpen: true, dialogOpen: false, drawerRelease: release })
    }
  }


  redeployRelease(release, forceRebuild){
    const { createRelease } = this.props;
    const { refetch } = this.props.data;

    createRelease({
      variables: { 
        headFeatureID: release.headFeature.id, 
        projectID: release.project.id, 
        environmentID: release.environment.id,
        forceRebuild: forceRebuild,
      },
    }).then(({data}) => {
      refetch()
    }).catch(function(err){
      refetch()
    });

    this.closeDrawer()
  }

  rollbackRelease(release){
    const { createRelease } = this.props;
    const { refetch } = this.props.data;

    createRelease({
      variables: { 
        id: release.id, 
        headFeatureID: release.headFeature.id, 
        projectID: release.project.id, 
        environmentID: release.environment.id,
        forceRebuild: false,
      },
    }).then(({data}) => {
      refetch()
    }).catch(function(err){
      refetch()
    });

    this.closeDrawer()
  }

  closeDrawer(){
    this.setState({ drawerOpen: false, drawerRelease: null })
  }

  stopRelease(release) {
    const { stopRelease } = this.props;
    const { refetch } = this.props.data
    stopRelease({
      variables: {
        id: release.id
      },
    }).then(({data}) => {
      refetch()
    }).catch(function(err){
      refetch()
    });
  }

  stopReleaseButton(release) {
    if (release.state !== "failed" || release.state !== "complete") {
      return (
        <Button
        className={styles.drawerButton}
        color="secondary"
        variant="raised"
        onClick={() => this.stopRelease(release)}>
          Stop Release
        </Button>
      )
    }
    return (
      <Button
        className={styles.drawerButton}
        color="secondary"
        variant="raised"
        disabled>
        Stop Release
        </Button>
    )
  }
  
  releaseActionButton(release) {
    let { currentRelease } = this.props.data.project;

    if (release.state !== "complete"){
      return (
        <div>
        <Button
          className={styles.drawerButton}
          color="primary"
          onClick={()=> this.setState({ drawerOpen: false, drawerRelease: null }) }>
          Cancel
        </Button>
        {this.stopReleaseButton(release)}
        </div>
      ); 
    }

    if (_.has(currentRelease, 'id') && currentRelease.id === release.id) {
      return (<div className={styles.inline}>
          <Button
          className={styles.drawerButton}
          variant="raised"
          color="primary"
          onClick={()=> this.redeployRelease(release, false)}>
          Redeploy
        </Button>
        <Button
          className={styles.drawerButton}
          variant="raised"
          color="secondary"
          onClick={()=> this.redeployRelease(release, true)}>
          Rebuild & Redeploy
        </Button>        
        <Button
          className={styles.drawerButton}
          color="primary"
          onClick={()=> this.setState({ drawerOpen: false, drawerRelease: null }) }>
          Cancel
        </Button>
      </div>)
    } else {
      return (<div>
        <Button
        className={styles.drawerButton}
        variant="raised"
        color="secondary"
        onClick={()=> this.rollbackRelease(release)}>
        Rollback
      </Button>
      <Button
        className={styles.drawerButton}
        color="primary"
        onClick={()=> this.setState({ drawerOpen: false, drawerRelease: null }) }>
        Cancel
      </Button>
    </div>)
    }
  }

  renderArtifact(artifact) {
    let multiline = false
    let rows = 1

    if (artifact.value.includes("\n")) {
      multiline = true
      rows = 10
    }

    return (<FormControl fullWidth className={styles.artifactPlaceholder}>
      <TextField
        label={artifact.key}
        InputLabelProps={{className: styles.artifactLabel}}
        InputProps={{className: styles.artifactInput}}
        helperText={artifact.source}
        multiline={multiline}
        rows={rows}
        value={artifact.value}
        margin="normal"
        disabled
      />
    </FormControl>)
  }

  renderDrawer(){
		if (this.state.drawerRelease === null){
			return null
    }

    let release = this.state.drawerRelease;
    let baseGitUrl = ""
    switch(this.props.data.project.gitProtocol) {
      case "SSH":
        baseGitUrl = this.props.data.project.gitUrl.split('git@')
        if(baseGitUrl.length > 0){
          baseGitUrl = baseGitUrl[1].replace(':', '/').split('.git')
          if(baseGitUrl.length > 0){
            baseGitUrl = "https://" + baseGitUrl[0] + "/commit/"
          }
        }
      break;
      case "HTTPS":
        baseGitUrl = this.props.data.project.gitUrl.split('.git', 1)
        if(baseGitUrl.length > 0){
          baseGitUrl = baseGitUrl[0] + "/commit/"
        }
      break;
    }

    return (
			<Drawer
				anchor="right"
				classes={{
				  paper: styles.drawer
        }}
        onClose={() => {this.setState({ drawerOpen: false })}}
				open={this.state.drawerOpen}>
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
                    <b>State:</b> {release.state}
                  </Typography>
                </CardContent>
              </Card>
              <Card square={true}>
                <CardContent>
                  <Typography>
                    <b>Message:</b> {release.stateMessage}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
						<Grid item xs={12}>
              <Grid container>
                <Grid item xs={12} style={{ textAlign: "left", padding: "1em" }}>
                  <Typography>
                    <a id="kibana-log-link" href={generateKibanaLink(kibanaReleaseLogTemplate, {"##PROJECT-NAMESPACE##": `${release.environment.key}-${this.props.data.project.slug}`, "##RELEASE-ID##": release.id})} target="_blank" className={styles.kibanaLogLink}>
                      RELEASE LOGS
                    </a>
                  </Typography>
                </Grid>
              </Grid>
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
										<b>HEAD</b> : <a target="_blank" href={baseGitUrl + release.headFeature.hash }>{release.headFeature.hash}</a>
									</Typography>                  
								</CardContent>
							</Card>                  
							<Card square={true}>
								<CardContent>                                               
									<Typography variant="body1">
										<b>TAIL</b> : <a  target="_blank" href={baseGitUrl + release.tailFeature.hash }>{release.tailFeature.hash}</a>
									</Typography>                                  
								</CardContent>
							</Card>                                    
						</Grid>
						<Grid item xs={12}>                
              {this.renderReleaseExtensionTable()}
						</Grid>
						<Grid item xs={12}>                
              <Card className={styles.card}>
                <CardContent>
                  <Typography variant="headline" component="h2">
                    Artifacts
                  </Typography>
                  <br/>
                  <Grid container spacing={24}>
                    {release.artifacts.map(artifact => {
                    return (
                    <Grid item xs={12}>
                      {this.renderArtifact(artifact)}
                    </Grid>
                    )
                    })}
                  </Grid>
                </CardContent>
              </Card>
						</Grid>
						<Grid item xs={12}>
              {this.releaseActionButton(release)}
						</Grid>
					</Grid>
				</div>
			</Drawer>
    ) 
  }
  
  render() {
    const { loading, project } = this.props.data;
    if(loading){
      return (<Loading />)
    }

    return (
      <div>
        <Grid container spacing={16}>
          <Grid item xs={12} className={styles.feature}>
            <Card square={true}>
              <CardContent>
                <Typography variant="title" style={{ display: "inline-block" }}>
                  Releases
                </Typography>
                <Typography variant="subheading" style={{ display: "inline-block", float: "right" }}>
                <a id="kibana-log-link" href={generateKibanaLink(kibanaAppLogTemplate, {"##PROJECT-NAMESPACE##": `${this.props.store.app.currentEnvironment.key}-${this.props.data.project.slug}`})} target="_blank" className={styles.kibanaLogLink}>
                  APPLICATION LOGS
                </a>
              </Typography>                              
              </CardContent>
            </Card>
            {project.releases.map((release) => {
              const extensions = release.releaseExtensions.map(function(releaseExtension){
                return releaseExtension.extension
              })

              return (<ReleaseView
                key={release.id}
                extensions={extensions}
                release={release}
                currentRelease={project.currentRelease}
                slug={project.slug}
                gitUrl={project.gitUrl}
                gitProtocol={project.gitProtocol}

                handleOnClick={(e) => this.handleToggleDrawer(release, e)}/>
              )})
            }
            {(project.releases.length === 0) && <Card square={true}>
              <CardContent>
                <Typography variant="subheading" style={{ textAlign: "center", fontWeight: 500, fontSize: 23, color: "gray" }}>
                  There are no releases.
                </Typography>
                <Typography variant="body1" style={{ textAlign: "center", fontSize: 16, color: "gray" }}>
                  Do some work and deploy a feature <NavLink to={"/projects/" + project.slug + "/features"}><strong>here.</strong></NavLink>
                </Typography>                  
              </CardContent>
            </Card>}
          </Grid>
        </Grid>
        {this.renderDrawer()}
      </div>
    );
  }
}
