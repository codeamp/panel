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

import { gql, graphql } from 'react-apollo';
import { autorun } from 'mobx';

@inject("store") @observer


class Project extends React.Component {
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
        slug: "/"
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
    const { loading, project } = this.props.data;

    if(loading){
      return null;
    }
    console.log('project index');
    if(this.props.store.app.ws.channel == "projects/" + this.props.data.project.slug) {
      this.props.data.refetch()
    }
  }

  render() {
    const { loading, project } = this.props.data;
    const { ws } = this.props.store.app;

    return (

      <div className={styles.root}>
        <Switch>
          <Route exact path='/projects/:slug' render={(props) => (
            <ProjectFeatures project={this.props.data} />
          )}/>
          <Route exact path='/projects/:slug/features' render={(props) => (
            <ProjectFeatures project={this.props.data} />
          )}/>
          <Route exact path='/projects/:slug/releases' render={(props) => (
            <ProjectReleases project={this.props.data} />
          )}/>
        </Switch>
      </div>
    );
  }
}


const GQL = gql`
  query Project($slug: String!){
    project(slug: $slug) {
      id
      name
      slug
    }
  }
`;

export default graphql(GQL, {
    options: (props) => ({
        variables: {
          slug: props.match.params.slug
        }
    }),
})(Project)
