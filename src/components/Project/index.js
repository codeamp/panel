import React from 'react';
import { Route, Switch } from "react-router-dom";
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import SettingsIcon from 'material-ui-icons/Settings';
import FeaturesIcon from 'material-ui-icons/Input';
import ReleasesIcon from 'material-ui-icons/Timeline';
import ServicesIcon from 'material-ui-icons/Widgets';
import ExtensionsIcon from 'material-ui-icons/Extension';

import ProjectFeatures from 'components/Project/Features';
import ProjectReleases from 'components/Project/Releases';
import ProjectSettings from 'components/Project/Settings';
import ProjectServices from 'components/Project/Services';
import ProjectExtensions from 'components/Project/Extensions';

@inject("store") @observer
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
        icon: <FeaturesIcon />,
        name: "Features",
        slug: this.props.match.url + "/features",
        count: 0,
      },
      {
        key: "30",
        icon: <ReleasesIcon />,
        name: "Releases",
        slug: this.props.match.url + "/releases",
      },
      {
        key: "40",
        icon: <ExtensionsIcon />,
        name: "Extensions",
        slug: this.props.match.url + "/extensions",
      },
      {
        key: "50",
        icon: <SettingsIcon />,
        name: "Settings",
        slug: this.props.match.url + "/settings",
      },
    ];
  }

  componentWillUpdate(nextProps){
      this.props.store.app.setUrl(nextProps.match.url)
  }

  shouldComponentUpdate(nextProps){
      this.props.store.app.leftNavItems = [
      {
          key: "10",
          icon: <ServicesIcon />,
          name: "Services",
          slug: nextProps.match.url + "/services",
      },
      {
          key: "20",
          icon: <FeaturesIcon />,
          name: "Features",
          slug: nextProps.match.url + "/features",
          count: 0,
      },
      {
          key: "30",
          icon: <ReleasesIcon />,
          name: "Releases",
          slug: nextProps.match.url + "/releases",
      },
      {
          key: "40",
          icon: <ExtensionsIcon />,
          name: "Extensions",
          slug: nextProps.match.url + "/extensions",
      },
      {
          key: "50",
          icon: <SettingsIcon />,
          name: "Settings",
          slug: nextProps.match.url + "/settings",
      },
    ];
    return true
  }

  render() {
    const { history } = this.props;

    return (
      <div className={styles.root}>
        <Switch>
          <Route exact path='/projects/:slug' render={(props) => (
            <ProjectFeatures history={history} {...props} />
          )}/>
          <Route exact path='/projects/:slug/services' render={(props) => (
            <ProjectServices {...props} />
          )}/>
          <Route exact path='/projects/:slug/features' render={(props) => (
            <ProjectFeatures history={history} {...props} />
          )}/>
          <Route exact path='/projects/:slug/releases' render={(props) => (
            <ProjectReleases {...props} />
          )}/>
          <Route exact path='/projects/:slug/extensions' render={(props) => (
            <ProjectExtensions {...props} />
          )}/>
          <Route exact path='/projects/:slug/settings' render={(props) => (
            <ProjectSettings {...props} />
          )}/>
        </Switch>
      </div>
    );
  }
}
