import React from 'react';
import styles from './style.module.css';
import gql from 'graphql-tag';

import DoesNotExist404 from 'components/Utils/DoesNotExist404'

import { withApollo } from 'react-apollo';
import { Route, Switch } from "react-router-dom";
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';

import ProjectFeatures from 'components/Project/Features';
import ProjectSecrets from 'components/Project/Secrets';
import ProjectReleases from 'components/Project/Releases';
import ProjectSettings from 'components/Project/Settings';
import ProjectServices from 'components/Project/Services';
import ProjectExtensions from 'components/Project/Extensions';

import IconButton from 'material-ui/IconButton';
import SettingsIcon from '@material-ui/icons/Settings';
import FeaturesIcon from '@material-ui/icons/Input';
import ReleasesIcon from '@material-ui/icons/Timeline';
import ServicesIcon from '@material-ui/icons/Widgets';
import SecretIcon from '@material-ui/icons/VpnKey';
import ExtensionsIcon from '@material-ui/icons/Extension';
import StarBorderIcon from '@material-ui/icons/StarBorder';
//import StarIcon from '@material-ui/icons/Star';

import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Menu, { MenuItem } from 'material-ui/Menu';
import Button from 'material-ui/Button';
import Typography from 'material-ui/Typography';

@inject("store") @observer

@graphql(gql`
  query Project($slug: String, $environmentID: String){
    project(slug: $slug, environmentID: $environmentID) {
      id
      name
      slug
      repository
      gitUrl
      gitProtocol
      gitBranch
      currentRelease {
         id
         created
         headFeature {
           id
           created
         }
      }
      releases {
        entries{
          id
          state
        }
      }
      features(params: { limit: 25}){
        entries {
          id
          created
        }
      }
      environments {
        id
        key
        name
        color
        created
      }
      bookmarked
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
  mutation BookmarkProject ($id: ID!) {
    bookmarkProject(id: $id)
  }`, { name: "bookmarkProject" }
)

class Project extends React.Component {
  constructor(props){
    super(props)
    this.state = {

    }
    console.log("RPOJECT CONSTRUCTED")
  }

  componentWillMount() {
    console.log("Project:", this.props)
  }

  setLeftNavProjectItems = (props) => {
    const { loading, project } = props.data;

    if(loading || !project){
        return null
    }

    // count deployable features by comparing currentRelease created and feature created
    let deployableFeatures = project.features.entries.length
    if(project.currentRelease){
      deployableFeatures = project.features.entries.filter(function(feature){
        return (new Date(feature.created).getTime() > new Date(project.currentRelease.headFeature.created).getTime())
      }).length
    } 

    let releasesQueued = project.releases.entries.filter(function(release){
      return ["waiting", "running"].includes(release.state)
    }).length

    let currentEnv = this.props.store.app.currentEnvironment.key
    this.props.store.app.leftNavItems = [
        {
          key: "10",
          icon: <FeaturesIcon />,
          name: "Features",
          slug: `${props.match.url}/${currentEnv}/features`,
          count: deployableFeatures,
        },
        {
          key: "20",
          icon: <ReleasesIcon />,
          name: "Releases",
          slug: `${props.match.url}/${currentEnv}/releases`,
          count: releasesQueued,
          badgeColor: "secondary",
        },
        {
          key: "30",
          icon: <ServicesIcon />,
          name: "Services",
          slug: `${props.match.url}/${currentEnv}/services`,
        },
        {
          key: "40",
          icon: <SecretIcon />,
          name: "Secrets",
          slug: `${props.match.url}/${currentEnv}/secrets`,
        },
        {
          key: "50",
          icon: <ExtensionsIcon />,
          name: "Extensions",
          slug: `${props.match.url}/${currentEnv}/extensions`,
        },
        {
          key: "60",
          icon: <SettingsIcon />,
          name: "Settings",
          slug: `${props.match.url}/${currentEnv}/settings`,
        },
    ];
  }

  renderBookmark() {
    let handleBookmarkProject = this.handleBookmarkProject.bind(this)

    let bookmarked = (
     <IconButton aria-label="Bookmark" onClick={handleBookmarkProject()}>
        <StarBorderIcon/>
      </IconButton>
    )

    return bookmarked
  }

  render() {
    console.log("project render")

    const { history, socket } = this.props;
    const { loading, project, error } = this.props.data;
    if(loading){
      console.log("LOADING")
      return null
    }

    const { app } = this.props.store;

    if (!project || error) {
      console.log("THIS DOES NOT EXIST")
      return <DoesNotExist404/>
    }

    const { environments } = project;
    if (environments === null) {
      console.log("THIS DOES NOT EXIST 2")
      return <DoesNotExist404/> 
    }
    
    console.log(project)

    let renderBookmark = this.renderBookmark.bind(this)

    // If we have a valid environment, redirect the user to the 
    // url with the environment encoded (it will send us back through here once more)
    // return <EnvironmentForwarder {...this.props} env={environmentName}/>
    return (
      <div>
        <Grid container spacing={24}>
          <Grid item xs={9}>
            <Toolbar style={{paddingLeft: "0px"}}>
              {renderBookmark()}
              <Typography variant="title">
                {project.name} <span className={styles.gitBranch}>({project.gitBranch})</span>
              </Typography>
            </Toolbar>
          </Grid>
          <Grid item xs={3} style={{textAlign: "right"}}>
            <Toolbar style={{textAlign: "right", display: "inline-flex"}}>
              { !!app.currentEnvironment.id && 
                <Button
                  className={styles.EnvButton}
                  variant="raised"
                  aria-owns={this.state.environmentAnchorEl ? 'environment-menu' : null}
                  aria-haspopup="true"
                  onClick={this.handleEnvironmentClick.bind(this)}
                  disabled={project.environments.length <= 1}>
                  {app.currentEnvironment.name}
                </Button>
              }
              { project.environments.length > 0 && 
                <Menu
                  id="environment-menu"
                  anchorEl={this.state.environmentAnchorEl}
                  open={Boolean(this.state.environmentAnchorEl)}
                  onClose={this.handleEnvironmentClose.bind(this)}>
                  {project.environments.map((env) => {
                    return (<MenuItem
                      key={env.id}
                      onClick={this.handleEnvironmentSelect.bind(this, env.id)}>
                      {env.name}
                    </MenuItem>)
                  })}
                </Menu>
              }
            </Toolbar>
          </Grid>
        </Grid>
        <Switch>
          <Route exact path='/projects/:slug/:environment/features' render={(props) => (
            <ProjectFeatures history={history} socket={socket} {...props} />
          )}/>
          <Route exact path='/projects/:slug/:environment/releases' render={(props) => (
            <ProjectReleases socket={socket} {...props} />
          )}/>
          <Route exact path='/projects/:slug/:environment/services' render={(props) => (
            <ProjectServices socket={socket} {...props} />
          )}/>
          <Route exact path='/projects/:slug/:environment/secrets' render={(props) => (
            <ProjectSecrets  history={history} socket={socket} {...props} />
          )}/>
          <Route exact path='/projects/:slug/:environment/extensions' render={(props) => (
            <ProjectExtensions socket={socket} {...props} />
          )}/>
          <Route exact path='/projects/:slug/:environment/settings' render={(props) => (
            <ProjectSettings socket={socket} {...props} />
          )}/>
          <Route path='/projects/:slug/:environment' render={(props) => (
            <ProjectFeatures history={history} socket={socket} {...props} />
          )}/>
          <Route path='/projects/:slug' render={(props) => (
            <ProjectFeatures history={history} socket={socket} {...props} />
          )} />
          <Route component={DoesNotExist404} />
        </Switch>
      </div>
    )
    
  }
}

// class EnvironmentForwarder extends React.Component {
//   constructor(props){
//     super(props)
//     this.state = {}
//   }

//   componentWillMount() {
//     if (!!this.props.env) {
//       this.props.history.push(`/projects/${this.props.match.params.slug}/${this.props.env}/features`)
//     }
//   }

//   render() {
//     return null
//   }
// }


export default withApollo(Project)