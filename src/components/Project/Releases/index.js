import React from 'react';
import { observer, inject } from 'mobx-react';
import { NavLink } from 'react-router-dom';
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
import DoubleRightIcon from 'react-icons/lib/fa/angle-double-right';
import ExtensionStateCompleteIcon from 'material-ui-icons/CheckCircle';
import ExtensionStateFailedIcon from 'material-ui-icons/Error';
import Loading from 'components/Utils/Loading';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import MobxReactForm from 'mobx-react-form';
import _ from "lodash"
import Chip from 'material-ui/Chip';

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

    const orderedExtensions = filteredExtensions.sort(function(a, b){
        if(b.extension.type === "workflow"){
            return 1
        } else {
            return -1
        }
    })

    const projectExtensionLights = orderedExtensions.map(function(extension){
      for(var i = 0; i < release.releaseExtensions.length; i++){
        if(release.releaseExtensions[i].extension.id === extension.id){
          // get state { waiting => yellow, failed => red, complete => green}
          switch(release.releaseExtensions[i].state){  
            case "waiting":
            return (<div key={"waiting"+release.releaseExtensions[i].id} className={styles.innerWaiting}></div>)
            case "complete":
            return (<div key={"complete"+release.releaseExtensions[i].id} className={styles.innerComplete}></div>)
            case "failed":
            return (<div key={"failed"+release.releaseExtensions[i].id} className={styles.innerFailed}></div>)                        
            default:
            return (<div key={"waiting"+release.releaseExtensions[i].id} className={styles.innerWaiting}></div>)
          }
        }
      }
      return (<div key="notStarted" className={styles.innerNotStarted}></div>)
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
      default:
        state = null
    }

    return (
      <Grid item xs={12} onClick={this.props.handleOnClick}>
        <Card disabled={this.props.showFullView} square={true} style={{ paddingBottom: 0 }}>
          <CardContent>
            <Grid container spacing={0}>
              <Grid item xs={10}>
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

export default class Releases extends React.Component {
  state = {
    drawerRelease: null,
  };

  componentWillMount() {    
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
  };

  renderReleaseExtensionTable() {
		if (this.state.drawerRelease === null){
			return null
		}

    const { project } = this.props.data;
    const release = this.state.drawerRelease
    const extensions = project.extensions

    // filter out 'once' types
    const filteredExtensions = extensions.filter(function(extension){
        if(extension.extension.type === "once") {
            return false
        } 
        return true
    })

    const orderedExtensions = filteredExtensions.sort(function(a, b){
        if(b.extension.type === "workflow"){
            return 1
        } else {
            return -1
        }
    })

    const releaseExtensions = orderedExtensions.map(function(extension){
      let found = false
      let stateIcon = <CircularProgress size={25} /> 

      for(var i = 0; i < release.releaseExtensions.length; i++){
        if(release.releaseExtensions[i].extension.id === extension.id){
          found = true
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
        if(!found){        
            return (
            <TableRow
                tabIndex={-1}
                key={extension.id}>
                <TableCell> { extension.extension.name } </TableCell>
                <TableCell> { stateIcon } </TableCell>
                <TableCell>
                    Not started
                </TableCell>
                <TableCell>
                    {extension.extension.type}
                </TableCell>
            </TableRow>)
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

  handleToggleDrawer(release){
    this.setState({ drawerOpen: true, dialogOpen: false, drawerRelease: release })
  }

  redeployRelease(release){
    const { createRelease } = this.props;
    const { refetch } = this.props.data;

    createRelease({
      variables: { 
        headFeatureID: release.headFeature.id, 
        projectID: release.project.id, 
        environmentID: release.environment.id 
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
        releaseId: release.id, 
        headFeatureID: release.headFeature.id, 
        projectID: release.project.id, 
        environmentID: release.environment.id 
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
  
  releaseActionButton(release) {
    let { currentRelease } = this.props.data.project;

    if (release.state !== "complete"){
      return null; 
    }

    if (_.has(currentRelease, 'id') && currentRelease.id === release.id) {
      return (<Button
        className={styles.drawerButton}
        variant="raised"
        color="primary"
        onClick={()=> this.redeployRelease(release)}>
        Redeploy
      </Button>)
    } else {
      return (<Button
        className={styles.drawerButton}
        variant="raised"
        color="secondary"
        onClick={()=> this.rollbackRelease(release)}>
        Rollback
      </Button>)
    }
  }

  renderDrawer(){
		if (this.state.drawerRelease === null){
			return null
		}

    let release = this.state.drawerRelease;
    
    return (
			<Drawer
				anchor="right"
				classes={{
				  paper: styles.drawer
				}}
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
										Git Info
									</Typography>
								</CardContent>
							</Card>                       
							<Card square={true}>
								<CardContent>                                     
									<Typography variant="body1">
										<b>HEAD</b> : {release.headFeature.hash }
									</Typography>                  
								</CardContent>
							</Card>                  
							<Card square={true}>
								<CardContent>                                               
									<Typography variant="body1">
										<b>TAIL</b> : {release.tailFeature.hash }
									</Typography>                                  
								</CardContent>
							</Card>                                    
						</Grid>
						<Grid item xs={12}>                
              {this.renderReleaseExtensionTable()}
						</Grid>
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
											{release.artifacts.map(artifact => {
											return (
											<TableRow
												key={artifact.key}>
												<TableCell>
													{artifact.key}
												</TableCell>
												<TableCell>
													{artifact.value}
												</TableCell>
											</TableRow>
											)
											})}
										</TableBody>
									</Table>
								</div>
							</Paper>
						</Grid>
						<Grid item xs={12}>
              {this.releaseActionButton(release)}
							<Button
                className={styles.drawerButton}
								color="primary"
								onClick={()=> this.setState({ drawerOpen: false, drawerRelease: null }) }>
								Cancel
							</Button>
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
                <Typography variant="title">
                  Releases
                </Typography>
              </CardContent>
            </Card>
            {project.releases.map((release) => {
            return (<ReleaseView
              key={release.id}
              extensions={project.extensions}
              release={release}
              currentRelease={project.currentRelease}
              handleOnClick={() => this.handleToggleDrawer(release)}/>
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
