import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Button from 'material-ui/Button';
import MobileStepper from 'material-ui/MobileStepper';
import Grid from 'material-ui/Grid';

@inject("store") @observer

class ReleaseView extends React.Component {
  
  constructor(props){
    super(props)
  }

  render() {
    return (
      <Grid item xs={12} onClick={this.props.handleOnClick}>
        <Card className={this.props.showFullView == false ? styles.feature : styles.fullFeature } raised={this.props.showFullView}>
          <CardContent>
            <Typography className={styles.featureCommitMsg}>
              { this.props.release.hash } - { this.props.release.message }
            </Typography>
            <Typography component="p" className={styles.featureAuthor}>
              by <b> { this.props.release.user } </b> - { this.props.release.created } 
            </Typography>
          </CardContent>
          <CardActions style={{ float: 'right', paddingRight: 35 }}>
            <Button raised color="primary" className={this.props.showFullView == false ? styles.hide : '' }>
              Rollback
            </Button>
          </CardActions>
        </Card>
      </Grid>      
    );
  }
}

export default class Releases extends React.Component {
  state = {
    activeStep: 0,
  };

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

  componentWillMount() {
    console.log(this.props.project);
  };

  render() {
    return (
      <div className={styles.root}>
        <Grid container spacing={16}>
          <div>
            {[...Array(this.props.project.releases.length)].map((x, i) =>
                <ReleaseView
                  key={this.props.project.releases[i].hash}
                  release={this.props.project.releases[i]} 
                  handleOnClick={() => this.setState({ activeFeatureKey: i })} 
                  showFullView={this.state.activeFeatureKey == i} />
              )}
              <br/>  
            </div>
        </Grid>
      </div>
    );
  }
}
