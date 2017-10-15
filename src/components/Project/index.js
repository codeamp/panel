import React from 'react';
import { Route, Switch } from "react-router-dom";
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import LogsIcon from 'material-ui-icons/ClearAll';
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
      currentRelease {
        id
        state
        stateMessage 
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
      environmentVariables {
        id
        key
        value
        user {
          id
          email
        }
        type
        created
        version
        versions {
          id
          key
          value
          user {
            id
            email
          }
          type
          created
          version
        }
      }
      services {
        id
        name
        command
        serviceSpec {
          id
          name
        }
        count
        oneShot
        containerPorts {
          port 
          protocol 
        }
        created
      }
      features {
        id
        message
        user
        hash
        parentHash
        ref
        created
      }
      releases {
        id
        state
        stateMessage 
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
    }
  }
`

// @graphql(gql`
// query EnvironmentVariablesWithAllVersions($key: String!, $projectId: String!){
//   environmentVariablesWithAllVersions(environmentVariable:{
//     key: $key,
//     projectId: $projectId,
//   }) {
//     id
//     key
//     value
//     creator {
//       id
//       email
//     }
//     version
//   }
// }
// `)


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
      {
        key: "60",
        icon: <LogsIcon />,
        name: "Logs", 
        slug: "/"
      } 
    ]; 
  }

  componentDidMount() {

    this.props.socket.on("projects/" + this.props.data.variables.slug, (data) => {
      clearTimeout(this.state.fetchDelay)
      this.props.data.refetch()
    })

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/features", (data) => {
      clearTimeout(this.state.fetchDelay)
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch()
      }, 2000);
    });

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/services", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/services', data);
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
      }, 2000);
    })

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/services/new", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/services/new', data);
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();        
        this.props.store.app.setSnackbar({msg: "A new service "+ data.name +" was created"})
      }, 2000);
    })

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/services/updated", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/services/updated', data);
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();        
        this.props.store.app.setSnackbar({msg: "Service "+ data.name +" was updated"})
      }, 2000);
    })  

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/services/deleted", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/services/deleted', data);
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();        
        this.props.store.app.setSnackbar({msg: "Service "+ data.name +" was deleted"})
      }, 2000);
    })         

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/environmentVariables/created", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/environmentVariables/created', data);
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();        
        this.props.store.app.setSnackbar({msg: "Environment variable "+ data.key +" was created."})
      }, 2000);
    })    

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/environmentVariables/updated", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/environmentVariables/updated', data);
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();        
        this.props.store.app.setSnackbar({msg: "Environment variable "+ data.key +" was updated."})
      }, 2000);
    })      

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/environmentVariables/deleted", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/environmentVariables/deleted', data);
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();        
        this.props.store.app.setSnackbar({msg: "Environment variable "+ data.key +" was deleted."})
      }, 2000);
    })            
  }

  render() {
    const { loading, project } = this.props.data;
    console.log(this.props)
    const { store, serviceSpecs, user } = this.props;

    if(loading){
      return null;
    }
    
    this.props.store.app.setProjectTitle(project.name);        

    return (
      <div className={styles.root}>
        <Switch>
          <Route exact path='/projects/:slug' render={(props) => (
            <ProjectFeatures project={project} store={store} />
          )}/>
          <Route exact path='/projects/:slug/services' render={(props) => (
            <ProjectServices user={user} project={project} store={store} serviceSpecs={serviceSpecs} />
          )}/>          
          <Route exact path='/projects/:slug/features' render={(props) => (
            <ProjectFeatures project={project} store={store} />
          )}/>
          <Route exact path='/projects/:slug/releases' render={(props) => (
            <ProjectReleases project={project} />
          )}/>
          <Route exact path='/projects/:slug/extensions' render={(props) => (
            <ProjectExtensions project={project} />
          )}/>          
          <Route exact path='/projects/:slug/settings' render={(props) => (
            <ProjectSettings project={project} />
          )}/>          
          <Route exact path='/projects/:slug/logs' render={(props) => (
            <ProjectSettings project={project} />
          )}/>                    
        </Switch>
      </div>
    );
  }
}
