import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Button from 'material-ui/Button';
import MobileStepper from 'material-ui/MobileStepper';
import Grid from 'material-ui/Grid';
import PropTypes from 'prop-types';
import { CircularProgress } from 'material-ui/Progress';
import { graphql, gql } from 'react-apollo';


@inject("store") @observer


@graphql(gql`
  mutation Mutation($featureId: String!) {
    createRelease(feature: { id: $featureId }) {
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
`)


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
  }

  handleDeploy(){
    console.log('handleDeploy', this.props)

  }

  render() {
    return (
      <Grid item xs={12} onClick={this.props.handleOnClick}>
        <Card className={this.props.showFullView == false ? styles.feature : styles.fullFeature } raised={this.props.showFullView}>
          <CardContent>
            <Typography className={styles.featureCommitMsg}>
              { this.props.feature.hash } - { this.props.feature.message }
            </Typography>
            <Typography component="p" className={styles.featureAuthor}>
              by <b> { this.props.feature.user } </b> - { this.props.feature.created } 
            </Typography>
          </CardContent>
          <CardActions style={{ float: 'right', paddingRight: 35 }}>
            <Button raised color="primary" 
                    onClick={this.handleDeploy.bind(this)}
                    className={this.props.showFullView == false ? styles.hide : '' }>
              Deploy
            </Button>
          </CardActions>
        </Card>
      </Grid>      
    );
  }
}

export default class Features extends React.Component {

  constructor(props){ 
    super(props)
    this.state = {
      activeStep: 0,
      activeFeatureKey: -1,
    };       
  }

  componentDidMount(){    
    if(this.props.store){
      if(this.props.store.ws.msg.channel == "projects/" + this.props.project.slug + "/GitSync"){
        console.log(this.props.store.ws.msg.data)
      }          
    }
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

  renderFeatureList = (project) => {

    return (
      <div>
        {[...Array(project.features.length)].map((x, i) =>
            <FeatureView
              key={project.features[i].hash}
              feature={project.features[i]} 
              handleOnClick={() => this.setState({ activeFeatureKey: i })} 
              showFullView={this.state.activeFeatureKey == i} />
          )}
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

    let defaultComponent = (<Typography>Loading...</Typography>)

    if(this.props.project.features.length > 0) {
      defaultComponent = this.renderFeatureList(this.props.project);
    } else if(this.props.project.gitProtocol == "SSH"){
        defaultComponent = (<InitPrivateProjectComponent rsaPublicKey={this.props.project.rsaPublicKey}/>)
    } else if(this.props.project.gitProtocol == "HTTPS"){
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




