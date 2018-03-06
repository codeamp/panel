import React from 'react';
import { Route, Switch } from "react-router-dom";
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import styles from './style.module.css';
import SettingsIcon from 'material-ui-icons/Settings';
import FeaturesIcon from 'material-ui-icons/Input';
import ReleasesIcon from 'material-ui-icons/Timeline';
import ServicesIcon from 'material-ui-icons/Widgets';
import SecretIcon from 'material-ui-icons/VpnKey';
import ExtensionsIcon from 'material-ui-icons/Extension';
import ProjectFeatures from 'components/Project/Features';
import ProjectSecrets from 'components/Project/Secrets';
import ProjectReleases from 'components/Project/Releases';
import ProjectSettings from 'components/Project/Settings';
import ProjectServices from 'components/Project/Services';
import ProjectExtensions from 'components/Project/Extensions';
import Loading from 'components/Utils/Loading';

@inject("store") @observer

@graphql(gql`
  query Project($slug: String, $environmentID: String){
    project(slug: $slug, environmentID: $environmentID) {
      id
      slug
      features{
        id
      }
    }
  }`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.store.app.currentEnvironment.id,
    }
  })
})
export default class Project extends React.Component {
  state = {
    fetchDelay: null,
    url: this.props.match.url,
  };

  componentWillMount() {
    this.props.store.app.leftNavItems = [
      {
        key: "10",
        icon: <ServicesIcon />,
        name: "Services",
        slug: this.props.match.url + "/services",
      },
      {
        key: "20",
        icon: <SecretIcon />,
        name: "Secrets",
        slug: this.props.match.url + "/secrets",
      },
      {
        key: "30",
        icon: <FeaturesIcon />,
        name: "Features",
        slug: this.props.match.url + "/features",
        count: 10,
      },
      {
        key: "40",
        icon: <ReleasesIcon />,
        name: "Releases",
        slug: this.props.match.url + "/releases",
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

  render() {
    const { history, socket } = this.props;
    const { loading, project } = this.props.data;
    if(loading){
      return (<Loading />)
    }
    this.props.store.app.setProjectTitle(project.slug)
    return (
      <div className={styles.root}>
        <Switch>
          <Route exact path='/projects/:slug' render={(props) => (
            <ProjectFeatures history={history} {...props} socket={socket} />
          )}/>
          <Route exact path='/projects/:slug/services' render={(props) => (
            <ProjectServices {...props} />
          )}/>
          <Route exact path='/projects/:slug/secrets' render={(props) => (
            <ProjectSecrets {...props} />
          )}/>
          <Route exact path='/projects/:slug/features' render={(props) => (
            <ProjectFeatures history={history} {...props} socket={socket} />
          )}/>
          <Route exact path='/projects/:slug/releases' render={(props) => (
            <ProjectReleases {...props} socket={socket} />
          )}/>
          <Route exact path='/projects/:slug/extensions' render={(props) => (
            <ProjectExtensions {...props} socket={socket} />
          )}/>
          <Route exact path='/projects/:slug/settings' render={(props) => (
            <ProjectSettings {...props} />
          )}/>
        </Switch>
      </div>
    );
  }
}
