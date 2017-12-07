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

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const query = gql`
  query Project($slug: String, $environmentId: String){
    project(slug: $slug, environmentId: $environmentId) {
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
        releaseExtensions {
            id
            extension {
                extensionSpec {
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
        releaseExtensions {
            id
            extension {
                extensionSpec {
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
      extensions {
        id
        extensionSpec {
          id
          name
          type
        }
        state
        formSpecValues {
          key
          value
        }
        artifacts {
          key
          value
        }
        created
      }
    }
  }
`

@graphql(query, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentId: props.envId,
    }
  })
})



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
      {
        key: "60",
        icon: <LogsIcon />,
        name: "Logs",
        slug: "/"
      }
    ];
    this.props.data.refetch()
  }

  componentWillUpdate(nextProps){
      this.props.store.app.setUrl(nextProps.match.url)
      this.props.data.refetch()
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
      {
          key: "60",
          icon: <LogsIcon />,
          name: "Logs",
          slug: "/"
      }
    ];
    return true
  }

  render() {
    const { loading, project, variables, errors, error } = this.props.data;
    const { store, socket, user } = this.props;

    if(loading){
      return (
        <div>
          Loading ...
        </div>
      )
    }

    if(project)
      this.props.store.app.setProjectTitle(project.slug)

    console.log(this.props)

    return (
      <div className={styles.root}>
        <Switch>
          <Route exact path='/projects/:slug' render={(props) => (
            <ProjectFeatures project={project} store={store} {...this.props} />
          )}/>
          <Route exact path='/projects/:slug/services' render={(props) => (
            <ProjectServices user={user} project={project} store={store} {...this.props} />
          )}/>
          <Route exact path='/projects/:slug/features' render={(props) => (
            <ProjectFeatures project={project} store={store} {...this.props} />
          )}/>
          <Route exact path='/projects/:slug/releases' render={(props) => (
            <ProjectReleases project={project} socket={socket} variables={variables} {...this.props} />
          )}/>
          <Route exact path='/projects/:slug/extensions' render={(props) => (
            <ProjectExtensions project={project} store={this.props.store} />
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
