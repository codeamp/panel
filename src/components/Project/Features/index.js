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

import Snackbar from 'material-ui/Snackbar';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';

@inject("store") @observer

class InitPrivateProjectComponent extends React.Component {

  state = {
    open: false,
    message: null,
  };  

  copySSHKey(){
    console.log('copySSHKey');
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
    this.setState({ open: true });
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

        <div>
          <Snackbar
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            open={this.state.open}
            autoHideDuration={6000}
            onRequestClose={this.handleRequestClose}
            SnackbarContentProps={{
              'aria-describedby': 'message-id',
            }}
            message={<span id="message-id">SSH Key Copied.</span>}
            action={[
              <IconButton
                key="close"
                aria-label="Close"
                color="inherit"
                onClick={this.handleRequestClose}
              >
                <CloseIcon />
              </IconButton>,
            ]}
          />
        </div>        
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

export default class Features extends React.Component {

  state = {
    activeStep: 0,
  };

  componentDidMount(){    
    if(this.props.store){
      if(this.props.store.ws.msg.channel == "projects/" + this.props.data.project.slug + "/GitSync"){
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

  render() {
    const { loading, project } = this.props.data
    console.log(project);
    let defaultComponent = (<Typography>Loading...</Typography>)
    if(!loading && project.gitProtocol == "private"){
        defaultComponent = (<InitPrivateProjectComponent rsaPublicKey={project.rsaPublicKey}/>)
    } else if(!loading && project.gitProtocol == "public"){
        defaultComponent = (<InitPublicProjectComponent />)
    }

    return (
      <div className={styles.root}>
        <Grid container spacing={16}>
          <Grid item xs={12} className={styles.feature}>
            {defaultComponent}
          </Grid>          
        </Grid>
      </div>
    );
  }
}




