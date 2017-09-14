import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Button from 'material-ui/Button';
import MobileStepper from 'material-ui/MobileStepper';
import Grid from 'material-ui/Grid';
import PropTypes from 'prop-types';
import Paper from 'material-ui/Paper';

import CreateProject from '../../Create';

@inject("store") @observer

export default class Settings extends React.Component {

  state = {
    activeStep: 0,
  };

  componentDidMount(){    
    console.log('settings loaded')
  }

  render() {
    const { loading, project } = this.props.data
    console.log(project)

    return (
      <div className={styles.root}>
        <Grid container spacing={24}>

          <Grid item sm={3}>
            <Typography type="title" className={styles.settingsDescription}>
              Continuous Integration
            </Typography>
            <br/>
            <Typography type="caption" className={styles.settingsCaption}>
              Here you can setup your type of CI service to 
              integrate with the project.
            </Typography>            
          </Grid>

          <Grid item sm={9}>
            <Card className={styles.card} raised={false}>
              <CardContent>
                <Typography type="title" component="h3">
                  CI Stuff
                </Typography>
                <Typography component="p">
                  Lizards are a widespread group of squamate reptiles, with over 6,000 species, ranging
                  across all continents except Antarctica
                </Typography>
              </CardContent>
              <CardActions className={styles.action}>
                <Button raised color="primary">
                  Save Changes
                </Button>
              </CardActions>
            </Card>
          </Grid>              



          <Grid item sm={3}>
            <Typography type="title" className={styles.settingsDescription}>
              Slack Settings
            </Typography>
            <br/>
            <Typography type="caption" className={styles.settingsCaption}>
              Enter information for where you'd like to send deployment
              events via Slack.
            </Typography>            
          </Grid>

          <Grid item sm={9}>
            <Card className={styles.card} raised={false}>
              <CardContent>
                <Typography type="title" component="h3">
                  Enter Slack details
                </Typography>
                <Typography component="p">
                  Lizards are a widespread group of squamate reptiles, with over 6,000 species, ranging
                  across all continents except Antarctica
                </Typography>
              </CardContent>
              <CardActions className={styles.action}>
                <Button raised color="primary">
                  Save Changes
                </Button>
              </CardActions>
            </Card>
          </Grid>              



          <Grid item sm={3}>
            <Typography type="title" className={styles.settingsDescription}>
              Project Settings
            </Typography>
            <br/>
            <Typography type="caption" className={styles.settingsCaption}>
              You can update your project settings to point to a different url
              or make appropriate cascading modifications (e.g. if your project became private).
            </Typography>            
          </Grid>

          <Grid item sm={9}>
            <CreateProject title={"Update Project"} 
              type={"save changes"}
              createProjectFunc={this.updateProject} project={project} />
          </Grid>                        
        </Grid>
      </div>
    );
  }
}




