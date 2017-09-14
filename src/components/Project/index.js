import React from 'react';
import { Route, Switch } from "react-router-dom";
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import LogsIcon from 'material-ui-icons/ClearAll';
import SettingsIcon from 'material-ui-icons/Settings';
import FeaturesIcon from 'material-ui-icons/Input';
import ReleasesIcon from 'material-ui-icons/Timeline';
import ResourcesIcon from 'material-ui-icons/Widgets';
import ProjectFeatures from 'components/Project/Features';
import ProjectReleases from 'components/Project/Releases';
import ProjectSettings from 'components/Project/Settings';
import { gql, graphql } from 'react-apollo';

const query = gql`
  query Project($slug: String!){
    project(slug: $slug) {
      id
      name
      slug
      rsaPublicKey
      gitProtocol
      gitUrl
    }
  }
`

@graphql(query, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug
    }
  })
})

@inject("store") @observer

export default class Project extends React.Component {
  componentWillMount() {
    this.props.store.app.leftNavItems = [
      {
        key: "10",
        icon: <FeaturesIcon />,
        name: "Features",
        slug: "/projects/"+this.props.match.params.slug+"/features",
        count: 0,
      }, 
      {
        key: "20",
        icon: <ReleasesIcon />,
        name: "Releases",
        slug: "/projects/"+this.props.match.params.slug+"/releases",
      }, 
      {
        key: "30",
        icon: <ResourcesIcon />,
        name: "Resources",
        slug: "/"
      }, 
      {
        key: "40",
        icon: <SettingsIcon />,
        name: "Settings",
        slug: "/projects/"+this.props.match.params.slug+"/settings",
      }, 
      {
        key: "50",
        icon: <LogsIcon />,
        name: "Logs",
        slug: "/"
      } 
    ]; 
  }

  componentWillReact(){
    const { loading } = this.props.data;

    if(loading){
      return null;
    }

    if(this.props.store.ws.msg.channel == "projects/" + this.props.data.project.slug) {
      this.props.data.refetch()
    }
  }

  render() {
    const { loading, project } = this.props.data;

    return (
      <div className={styles.root}>
        <Switch>
          <Route exact path='/projects/:slug' render={(props) => (
            <ProjectFeatures data={this.props.data} />
          )}/>
          <Route exact path='/projects/:slug/features' render={(props) => (
            <ProjectFeatures data={this.props.data} />
          )}/>
          <Route exact path='/projects/:slug/releases' render={(props) => (
            <ProjectReleases data={this.props.data} />
          )}/>
          <Route exact path='/projects/:slug/settings' render={(props) => (
            <ProjectSettings data={this.props.data} />
          )}/>          
        </Switch>
      </div>
    );
  }
}
