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
        // this.props.store.app.setSnackbar({msg: "Environment variable "+ data.key +" was created."})
      }, 2000);
    })

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/environmentVariables/updated", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/environmentVariables/updated', data);
      clearTimeout(this.state.fetchDelay);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        // this.props.store.app.setSnackbar({msg: "Environment variable "+ data.key +" was updated."})
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

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/extensions/created", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/extensions/created', data);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        this.props.store.app.setSnackbar({msg: "Extension "+ data.extensionSpec.name +" was added to your project."})
      }, 2000);
    })

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/extensions/initCompleted", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/extensions/initCompleted', data);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        this.props.store.app.setSnackbar({msg: "Extension "+ data.extensionSpec.name +" was completed."})
      }, 2000);
    })

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/extensions/updated", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/extensions/updated', data);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        this.props.store.app.setSnackbar({msg: "Extension "+ data.extensionSpec.name +" was updated."})
      }, 2000);
    })

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/extensions/deleted", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/extensions/deleted', data);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        this.props.store.app.setSnackbar({msg: "Extension "+ data.extensionSpec.name + " was deleted."})
      }, 2000);
    })

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/releases/created", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/releases/created', data);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        console.log('release created')
        // this.props.history.push('/projects/' + this.props.data.variables.slug + '/releases')
        // this.props.store.app.setSnackbar({msg: "A release was created."})
      }, 2000);
    })

    this.props.socket.on("projects/" + this.props.data.variables.slug + "/releases/log", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/releases/log', data);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        console.log('release created')
        // this.props.store.app.setSnackbar({msg: "A release was created."})
      }, 2000);
    })


    this.props.socket.on("projects/" + this.props.data.variables.slug + "/releases/releaseExtensionComplete", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/releases/extensionComplete', data);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
      }, 2000);
    })


    this.props.socket.on("projects/" + this.props.data.variables.slug + "/releases/completed", (data) => {
      console.log('projects/' + this.props.data.variables.slug + '/releases/completed', data);
      this.state.fetchDelay = setTimeout(() => {
        this.props.data.refetch();
        // this.props.store.app.setSnackbar({msg: "DockerBuild finished running for release currently being built."})
      }, 2000);
    })

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

    this.props.socket.on("projects/" + nextProps.data.variables.slug + "/releases/created", (data) => {
      console.log('projects/' + nextProps.data.variables.slug + '/releases/created', data);
      this.state.fetchDelay = setTimeout(() => {
        nextProps.data.refetch();
        console.log('release created')
        // nextProps.history.push('/projects/' + nextProps.data.variables.slug + '/releases')
        // nextProps.store.app.setSnackbar({msg: "A release was created."})
      }, 2000);
    })

    this.props.socket.on("projects/" + nextProps.data.variables.slug + "/releases/log", (data) => {
      console.log('projects/' + nextProps.data.variables.slug + '/releases/log', data);
      this.state.fetchDelay = setTimeout(() => {
        nextProps.data.refetch();
        console.log('release created')
        // this.props.store.app.setSnackbar({msg: "A release was created."})
      }, 2000);
    })


    this.props.socket.on("projects/" + nextProps.data.variables.slug + "/releases/releaseExtensionComplete", (data) => {
      console.log('projects/' + nextProps.data.variables.slug + '/releases/extensionComplete', data);
      this.state.fetchDelay = setTimeout(() => {
        nextProps.data.refetch();
      }, 2000);
    })


    return true
  }

  render() {
    const { loading, project, variables, errors, error } = this.props.data;
    const { store, socket, serviceSpecs, extensionSpecs, user } = this.props;

    if(loading){
      return null;
    }
    this.props.store.app.setProjectTitle(project.name)

    return (
      <div className={styles.root}>
        <Switch>
          <Route exact path='/projects/:slug' render={(props) => (
            <ProjectFeatures project={project} store={store} {...this.props} />
          )}/>
          <Route exact path='/projects/:slug/services' render={(props) => (
            <ProjectServices user={user} project={project} store={store} serviceSpecs={serviceSpecs} />
          )}/>
          <Route exact path='/projects/:slug/features' render={(props) => (
            <ProjectFeatures project={project} store={store} {...this.props} />
          )}/>
          <Route exact path='/projects/:slug/releases' render={(props) => (
            <ProjectReleases project={project} socket={socket} variables={variables} {...this.props} />
          )}/>
          <Route exact path='/projects/:slug/extensions' render={(props) => (
            <ProjectExtensions project={project} extensionSpecs={extensionSpecs} store={this.props.store} />
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
