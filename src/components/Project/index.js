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
      features {
        message
        user
        hash
        parentHash
        ref
        created
      }
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
  state = {
    fetchDelay: null,
  };

  componentWillMount() {
    this.props.store.app.leftNavItems = [
      {
        key: "10",
        icon: <ResourcesIcon />,
        name: "Resources",
        slug: "/projects/"+this.props.match.params.slug+"/resources",
      }, 
      {
        key: "20",
        icon: <FeaturesIcon />,
        name: "Features",
        slug: "/projects/"+this.props.match.params.slug+"/features",
        count: 0,
      }, 
      {
        key: "30",
        icon: <ReleasesIcon />,
        name: "Releases",
        slug: "/projects/"+this.props.match.params.slug+"/releases",
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
      clearTimeout(this.state.fetchDelay)
      this.props.data.refetch()
    }

    if(this.props.store.ws.msg.channel == "projects/" + this.props.data.project.slug + "/features") {
      clearTimeout(this.state.fetchDelay)
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch()
      }, 2000);
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
