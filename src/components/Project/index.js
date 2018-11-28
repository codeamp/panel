import React from 'react';
import styles from './style.module.css';
import gql from 'graphql-tag';

import DoesNotExist404 from 'components/Utils/DoesNotExist404'
import Loading from 'components/Utils/Loading';

import { withApollo } from 'react-apollo';
import { Route, Switch, Redirect } from "react-router-dom";
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
import StarIcon from '@material-ui/icons/Star';

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
      environmentID: props.environment.id
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
  }

  componentDidUpdate() {
    this.setLeftNavProjectItems(this.props)
  }

  componentWillUnmount() {
    this.props.store.app.leftNavItems = []
  }

  handleEnvironmentClick = event => {
    this.setState({ environmentAnchorEl: event.currentTarget });
  };

  handleEnvironmentClose = (event, id) => {
    this.setState({ environmentAnchorEl: null });
  };

  handleEnvironmentSelect = (id) => {
    const { project } = this.props.data;

    project.environments.map((env) => {
      if(env.id === id){
        this.props.store.app.setCurrentEnv({id: id, color: env.color, name: env.name, key: env.key })

        var tokenizedURL = this.props.location.pathname.split("/")
        var redirectUrl = '/projects/' + this.props.match.params.slug + "/" + env.key
        if (tokenizedURL.length === 5) {
          redirectUrl += "/" + tokenizedURL[4]
        }

        this.props.history.push(redirectUrl)
        return null
      }
      return null
    })

    this.setState({ environmentAnchorEl: null });
  }

  handleBookmarkProject = () => {
    this.props.bookmarkProject({
      variables: {
        'id': this.props.data.project.id,
      }
    }).then(({ data }) => {
      this.props.data.refetch()
    })
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

    this.props.store.app.leftNavItems = [
        {
          key: "10",
          icon: <FeaturesIcon />,
          name: "Features",
          slug: `${props.match.url}/features`,
          count: deployableFeatures,
        },
        {
          key: "20",
          icon: <ReleasesIcon />,
          name: "Releases",
          slug: `${props.match.url}/releases`,
          count: releasesQueued,
          badgeColor: "secondary",
        },
        {
          key: "30",
          icon: <ServicesIcon />,
          name: "Services",
          slug: `${props.match.url}/services`,
        },
        {
          key: "40",
          icon: <SecretIcon />,
          name: "Secrets",
          slug: `${props.match.url}/secrets`,
        },
        {
          key: "50",
          icon: <ExtensionsIcon />,
          name: "Extensions",
          slug: `${props.match.url}/extensions`,
        },
        {
          key: "60",
          icon: <SettingsIcon />,
          name: "Settings",
          slug: `${props.match.url}/settings`,
        },
    ];
  }

  renderBookmark(isBookmarked) {
    let handleBookmarkProject = this.handleBookmarkProject.bind(this)

    let bookmarked = (
     <IconButton aria-label="Bookmark" onClick={handleBookmarkProject}>
        <StarBorderIcon/>
      </IconButton>
    )

    if(isBookmarked) {
      bookmarked = (
        <IconButton aria-label="Bookmark" onClick={handleBookmarkProject}>
          <StarIcon/>
        </IconButton>
      )
    }

    return bookmarked
  }

  render() {
    const { history, socket } = this.props;
    const { loading, project, error } = this.props.data;
    if(loading){
      return <Loading/>
    }

    const { app } = this.props.store;

    if (!project || error) {
      return <DoesNotExist404/>
    }

    const { environments } = project;
    if (environments === null) {
      return <DoesNotExist404/> 
    }
    
    let renderBookmark = this.renderBookmark.bind(this)

    // If we have a valid environment, redirect the user to the 
    // url with the environment encoded (it will send us back through here once more)
    // return <EnvironmentForwarder {...this.props} env={environmentName}/>
    return (
      <div>
        <Grid container spacing={24}>
          <Grid item xs={9}>
            <Toolbar style={{paddingLeft: "0px"}}>
              {renderBookmark(project.bookmarked)}
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

          <Redirect strict exact from={this.props.match.path + '/'} to={`${this.props.location.pathname}features`} />          
          <Redirect exact from ={this.props.match.path} to={`${this.props.location.pathname}/features`}/>

          <Route component={DoesNotExist404} />
        </Switch>
      </div>
    )
    
  }
}

export default withApollo(Project)