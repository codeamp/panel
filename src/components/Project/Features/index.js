import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Typography from 'material-ui/Typography';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import { CircularProgress } from 'material-ui/Progress';
import CopyGitHashIcon from 'material-ui-icons/ContentCopy';
import { graphql } from 'react-apollo';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import gql from 'graphql-tag';

class InitPrivateProjectComponent extends React.Component {
  state = {
    open: false,
    message: null,
  };

  render() {
    return (
      <Card className={styles.card} raised={false}>
        <CardContent>
          <Typography type="headline" component="h3">
            Setup the Git Deploy Key
          </Typography>
          <br/>
          <Typography
            id="ssh-key"
            component="p" className={styles.codeSnippet}>
            {this.props.rsaPublicKey}
          </Typography>
          <br/><br/>
          <Typography type="body1">
            <a href="https://developer.github.com/v3/guides/managing-deploy-keys/#deploy-keys">
              Click here to learn how to add deploy keys to Github.
            </a>
          </Typography>
        </CardContent>
      </Card>
    )
  }
}

class InitPublicProjectComponent extends React.Component {
  render() {
    return (
      <Card className={styles.card} raised={false}>
        <CardContent className={styles.progress}>
          <Typography type="subheading" component="h3">
            Currently pulling features down...
          </Typography>
          <br/>
          <CircularProgress size={50} />
        </CardContent>
      </Card>
    )
  }
}

class FeatureView extends React.Component {

  constructor(props){
      super(props)
      this.state = {
        disableDeployBtn: false,
        text: 'Deploy',
      }
  }

  handleDeploy(){
    this.setState({ disabledDeployBtn: true, text: 'Deploying'})
    this.props.createRelease({
      variables: { headFeatureId: this.props.feature.id, projectId: this.props.project.id, environmentId: this.props.store.app.currentEnvironment.id },
    }).then(({data}) => {
      this.props.data.refetch()
      this.props.history.push(this.props.match.url.replace('features', 'releases'))
    });
  }

  render() {
    const { project } = this.props;

    return (
      <Grid item xs={12} onClick={this.props.handleOnClick}>
          <div
            style={{ visibility: 'hidden', display: 'none' }}
            id={"git-hash-" + this.props.feature.id}>
              {this.props.feature.hash}
          </div> 
        <Card className={this.props.showFullView === false ? styles.feature : styles.fullFeature } raised={this.props.showFullView}>
          <CardContent>
            <Typography component="body1" style={{ fontSize: 14 }}>
              <b> { this.props.feature.message } </b>
            </Typography>
            <Typography component="body2" style={{ fontSize: 12 }}>
              { this.props.feature.user } created on { new Date(this.props.feature.created).toDateString() } at { new Date(this.props.feature.created).toTimeString() }
            </Typography>
          </CardContent>
          <CardActions style={{ position: "absolute", right: 10, top: 10 }}>
            <CopyToClipboard text={this.props.feature.hash} onCopy={() => this.props.copyGitHash(this.props.feature.hash)} className={this.props.showFullView === false ? styles.hide : '' }>
              <IconButton color="primary" className={this.props.showFullView === false ? styles.hide : '' }>
                <CopyGitHashIcon />
              </IconButton>
            </CopyToClipboard>       
            <Button variant="raised" color="primary"
              disabled={this.state.disabledDeployBtn || project.extensions.length === 0}
              onClick={this.handleDeploy.bind(this)}
              className={this.props.showFullView === false ? styles.hide : '' }>
              { this.state.text }
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  }
}
@inject("store") @observer

@graphql(gql`
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
      }
      extensions {
        id
      }
    }
  }
`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentId: props.store.app.currentEnvironment.id,
    }
  })
})

@graphql(gql`
mutation Mutation($headFeatureId: String!, $projectId: String!, $environmentId: String!) {
  createRelease(release: { headFeatureId: $headFeatureId, projectId: $projectId, environmentId: $environmentId }) {
    headFeature {
      message
    }
    tailFeature  {
      message
    }
    state
    stateMessage
  }
}
`, { name: "createRelease" })

export default class Features extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      activeFeatureKey: -1,
    };
  }

  copyGitHash(featureHash){
    this.props.store.app.setSnackbar({msg: "Git hash copied: " + featureHash});
  }

  renderFeatureList = (project) => {
    var self = this
    return (
      <div>
        {project.features.map(function(feature, idx) {
            let featureView = (
              <FeatureView
              {...self.props}
              copyGitHash={self.copyGitHash.bind(self)}
              key={feature.hash}
              createRelease={self.props.createRelease.bind(self)}
              feature={feature}
              project={project}
              handleOnClick={() => self.setState({ activeFeatureKey: idx })}
              showFullView={self.state.activeFeatureKey === idx} />
            )
            return featureView
        })}
          <br/>
        </div>
      )
  }

  componentWillMount(){
    this.setupSocketHandlers();
    const fields = [
      'branch[]',
      'branch[].key',
      'branch[].value',
    ];
    const rules = {};
    const labels = {};
    const initials = {};
    const types = {};
    const extra = {
      'branch': [
        { key: 1, value: 'dev'},
        { key: 2, value: 'prod'},
      ],
    };
    const hooks = {};
    const handlers = {};
    const plugins = { dvr: validatorjs };
    this.form = new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { handlers }, { plugins })
  }

  setupSocketHandlers(){
      const { socket, match } = this.props;

      socket.on(match.url.substring(1, match.url.length), (data) => {
          console.log('extension update', data)
              this.props.data.refetch()
      });
  }



  componentWillUpdate(nextProps, nextState){
    nextProps.data.refetch()
  }

  render() {
    const { loading, project } = this.props.data;

    if(loading){
      return (<div>Loading...</div>)
    }

    this.props.store.app.setProjectTitle(project.slug)
    let defaultComponent = (<Typography>Loading...</Typography>)

    if(project.features.length > 0) {
      defaultComponent = this.renderFeatureList(project);
    } else if(project.gitProtocol === "SSH"){
        defaultComponent = (<InitPrivateProjectComponent rsaPublicKey={project.rsaPublicKey}/>)
    } else if(project.gitProtocol === "HTTPS"){
        defaultComponent = (<InitPublicProjectComponent />)
    }

    return (
      <div className={styles.root}>
        <Grid container spacing={16}>
          <Grid container xs={12} className={styles.feature}>
            {/* <Grid item xs={4}>
              <SelectField field={this.form.$('branch')} fullWidth={true} />
            </Grid>             */}
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="title">
                  Features
                </Typography>
              </CardContent>
            </Card>
            {defaultComponent}
          </Grid>
        </Grid>
      </div>
    );
  }
}
