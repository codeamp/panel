import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Grid from 'material-ui/Grid';
import { CircularProgress } from 'material-ui/Progress';

import CopyGitHashIcon from 'material-ui-icons/ContentCopy';

import { graphql, gql } from 'react-apollo';


class InitPrivateProjectComponent extends React.Component {
  state = {
    open: false,
    message: null,
  };

  copySSHKey(){
    var sshKey = document.querySelector('#ssh-key');
    var range = document.createRange();
    range.selectNode(sshKey);
    window.getSelection().addRange(range);

    var successful = document.execCommand('copy')
    if(successful){
      this.handleClick();
    }
  };

  handleClick = () => {
    this.props.store.app.setSnackbar({msg: "SSH Key Copied."})
  };

  handleRequestClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ open: false });
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
          <br/>
          <Button
            onClick={this.copySSHKey.bind(this)}
            dense color="primary">
            Copy Key
          </Button>
          <br/>
          <br/>
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
    var self = this
    console.log('handleDeploy', this.props)
    this.setState({ disabledDeployBtn: true, text: 'Deploying'})
    this.props.createRelease({
      variables: { headFeatureId: this.props.feature.id, projectId: this.props.project.id },
    }).then(({data}) => {
      console.log(data)
      console.log('GOING to', self.props)
      self.props.history.push(self.props.match.url + '/releases')
    }).catch(error => {
      console.log(error)
    });
  }

  render() {
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
          <IconButton raised color="primary"
              onClick={() => this.props.copyGitHash(this.props.feature.id)}
              className={this.props.showFullView === false ? styles.hide : '' }>
              <CopyGitHashIcon />
            </IconButton>
            <Button raised color="primary"
              disabled={this.state.disabledDeployBtn || this.props.project.extensions.length == 0}
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
  mutation Mutation($headFeatureId: String!, $projectId: String!) {
    createRelease(release: { headFeatureId: $headFeatureId, projectId: $projectId }) {
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
      activeStep: 0,
      activeFeatureKey: -1,
    };
  }

  componentWillMount(){
    console.log("MOUNTING")
    this.props.data.refetch()
  }

  shouldComponentUpdate(){
      return true
  }

  handleNext = () => {
    this.setState({
      activeStep: this.state.activeStep + 1,
    });
  };

  handleBack = () => {
    this.setState({
      activeStep: this.state.activeStep - 1,
    });
  };

  copyGitHash(featureId){
    var gitHash = document.querySelector('#git-hash-' + featureId);
    var range = document.createRange();
    range.selectNode(gitHash);
    window.getSelection().addRange(range);

    var successful = document.execCommand('copy')
    console.log(this.props)
    if(successful){
      this.props.store.app.setSnackbar({msg: "Git hash copied."});
    }
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
            console.log(new Date(project.currentRelease.headFeature.created).getTime())
            console.log(new Date(feature.created).getTime())
            if(project.currentRelease.state !== "" && new Date(project.currentRelease.headFeature.created).getTime() > new Date(feature.created).getTime() || project.currentRelease.headFeature.message === feature.message){
                  featureView = ""
            }

            return featureView
        })}
          <br/>
        </div>
      )
  }

          //   <Grid item xs={12}>
          //   <MobileStepper
          //     type="text"
          //     steps={6}
          //     position="static"
          //     activeStep={this.state.activeStep}
          //     className={styles.mobileStepper}
          //     onBack={this.handleBack}
          //     onNext={this.handleNext}
          //     disableBack={this.state.activeStep === 0}
          //     disableNext={this.state.activeStep === 5}
          //   />
          // </Grid>

  render() {
    if(!this.props.project){
      return null
    }

    console.log(this.props)

    let defaultComponent = (<Typography>Loading...</Typography>)

    if(this.props.project.features.length > 0) {
      defaultComponent = this.renderFeatureList(this.props.project);
    } else if(this.props.project.gitProtocol === "SSH"){
        defaultComponent = (<InitPrivateProjectComponent rsaPublicKey={this.props.project.rsaPublicKey}/>)
    } else if(this.props.project.gitProtocol === "HTTPS"){
        defaultComponent = (<InitPublicProjectComponent />)
    }

    return (
      <div className={styles.root}>
        <Grid container spacing={16}>
          <Grid item xs={12} className={styles.feature}>
            <Typography type="headline" component="h3">
              Features
            </Typography>
            <br/>
            {defaultComponent}
          </Grid>
        </Grid>
      </div>
    );
  }
}




