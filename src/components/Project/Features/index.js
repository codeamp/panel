import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Button from 'material-ui/Button';
import MobileStepper from 'material-ui/MobileStepper';
import Grid from 'material-ui/Grid';
import PropTypes from 'prop-types';


@inject("store") @observer

export default class Features extends React.Component {
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

  render() {
    console.log(this.props)
    return (
      <div className={styles.root}>
        <Grid container spacing={16}>
          {[...Array(5)].map((x, i) =>
          <Grid item xs={12} className={styles.feature} key={i}>
            <Card className={styles.card} raised={false}>
              <CardContent>
                <Typography type="headline" component="h3">
                  Lizard
                </Typography>
                <Typography component="p">
                  Lizards are a widespread group of squamate reptiles, with over 6,000 species, ranging
                  across all continents except Antarctica
                </Typography>
              </CardContent>
              <CardActions>
                <Button dense color="primary">
                  Deploy
                </Button>
              </CardActions>
            </Card>
          </Grid>
          )}
          <Grid item xs={12}>
            <MobileStepper
              type="text"
              steps={6}
              position="static"
              activeStep={this.state.activeStep}
              className={styles.mobileStepper}
              onBack={this.handleBack}
              onNext={this.handleNext}
              disableBack={this.state.activeStep === 0}
              disableNext={this.state.activeStep === 5}
            />
          </Grid>
        </Grid>
      </div>
    );
  }
}




