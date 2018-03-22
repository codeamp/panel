import React from 'react';
import { Route, Switch } from "react-router-dom";
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import styles from './style.module.css';
import IconButton from 'material-ui/IconButton';
import SettingsIcon from 'material-ui-icons/Settings';
import FeaturesIcon from 'material-ui-icons/Input';
import ReleasesIcon from 'material-ui-icons/Timeline';
import ServicesIcon from 'material-ui-icons/Widgets';
import SecretIcon from 'material-ui-icons/VpnKey';
import ExtensionsIcon from 'material-ui-icons/Extension';
import StarBorderIcon from 'material-ui-icons/StarBorder';
import StarIcon from 'material-ui-icons/Star';
import ProjectFeatures from 'components/Project/Features';
import ProjectSecrets from 'components/Project/Secrets';
import ProjectReleases from 'components/Project/Releases';
import ProjectSettings from 'components/Project/Settings';
import ProjectServices from 'components/Project/Services';
import ProjectExtensions from 'components/Project/Extensions';
import Loading from 'components/Utils/Loading';
import DoesNotExist404 from 'components/Utils/DoesNotExist404';
import Typography from 'material-ui/Typography';
import Toolbar from 'material-ui/Toolbar';
import Menu, { MenuItem } from 'material-ui/Menu';
import Button from 'material-ui/Button';
import { withApollo } from 'react-apollo';
import Grid from 'material-ui/Grid';

@inject("store") @observer

@graphql(gql`
  query Project($slug: String, $environmentID: String){
    project(slug: $slug, environmentID: $environmentID) {
      id
      slug
      currentRelease {
         id
         created
         headFeature {
           id
           created
         }
      }
      features{
        id
        created
      }
      environments {
        id
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
      fetchDelay: null,
      url: this.props.match.url,
      environmentAnchorEl: undefined,
    }
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
        this.props.store.app.setCurrentEnv({id: id, color: env.color, name: env.name })
        this.props.client.resetStore()
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
    var deployableFeatures = 0
    if(project.currentRelease !== null){
      project.features.map(function(feature){
        if(new Date(feature.created).getTime() >= new Date(project.currentRelease.headFeature.created).getTime()){
          deployableFeatures += 1
        }
        return null
      })
    } else {
      deployableFeatures = project.features.length
    }
        
    this.props.store.app.leftNavItems = [
        {
          key: "10",
          icon: <FeaturesIcon />,
          name: "Features",
          slug: this.props.match.url + "/features",
          count: deployableFeatures,
        },
        {
          key: "20",
          icon: <ReleasesIcon />,
          name: "Releases",
          slug: this.props.match.url + "/releases",
        },
        {
          key: "30",
          icon: <ServicesIcon />,
          name: "Services",
          slug: this.props.match.url + "/services",
        },
        {
          key: "40",
          icon: <SecretIcon />,
          name: "Secrets",
          slug: this.props.match.url + "/secrets",
        },
        {
          key: "50",
          icon: <ExtensionsIcon />,
          name: "Extensions",
          slug: this.props.match.url + "/extensions",
        },
        {
          key: "60",
          icon: <SettingsIcon />,
          name: "Settings",
          slug: this.props.match.url + "/settings",
        },
    ];
  }

  componentWillReceiveProps(nextProps) {
    this.setLeftNavProjectItems(nextProps)
  }

  render() {
    const { history, socket } = this.props;
    const { loading, project } = this.props.data;
    const { app } = this.props.store;

    if(loading){
      return (<Loading />)
    }

    // handle invalid project
    if(!project){
      return (<DoesNotExist404 />)
    }

    let bookmarked = (
      <IconButton aria-label="Bookmark" onClick={this.handleBookmarkProject.bind(this)}>
        <StarBorderIcon/>
      </IconButton>
    )

    if(project.bookmarked) {
      bookmarked = (
        <IconButton aria-label="Bookmark" onClick={this.handleBookmarkProject.bind(this)}>
          <StarIcon/>
        </IconButton>
      ) 
    }
    return (
      <div className={styles.root}>
        <Grid container spacing={24}>
          <Grid item xs={9}>
            <Toolbar style={{paddingLeft: "0px"}}>
              {bookmarked}
              <Typography variant="title">
                {project.slug}
              </Typography>
            </Toolbar>
          </Grid>
          <Grid item xs={3} style={{textAlign: "right"}}>
            <Toolbar style={{textAlign: "right", display: "inline-flex"}}>
              <Button
                className={styles.EnvButton}
                variant="raised"
                aria-owns={this.state.environmentAnchorEl ? 'environment-menu' : null}
                aria-haspopup="true"
                onClick={this.handleEnvironmentClick.bind(this)}>
                {app.currentEnvironment.name}
              </Button>
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
            </Toolbar>
          </Grid>
        </Grid>
        <Switch>
          <Route exact path='/projects/:slug/features' render={(props) => (
            <ProjectFeatures history={history} {...props} socket={socket} />
          )}/>
          <Route exact path='/projects/:slug/releases' render={(props) => (
            <ProjectReleases {...props} socket={socket} />
          )}/>
          <Route exact path='/projects/:slug' render={(props) => (
            <ProjectFeatures history={history} {...props} socket={socket} />
          )}/>
          <Route exact path='/projects/:slug/services' render={(props) => (
            <ProjectServices {...props} />
          )}/>
          <Route exact path='/projects/:slug/secrets' render={(props) => (
            <ProjectSecrets {...props} />
          )}/>
          <Route exact path='/projects/:slug/extensions' render={(props) => (
            <ProjectExtensions {...props} socket={socket} />
          )}/>
          <Route exact path='/projects/:slug/settings' render={(props) => (
            <ProjectSettings {...props} />
          )}/>
          <Route component={DoesNotExist404} />
        </Switch>
      </div>
    );
  }
}

export default withApollo(Project)
