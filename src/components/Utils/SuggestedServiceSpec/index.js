import React from 'react';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import TextField from 'material-ui/TextField';
import Card from 'material-ui/Card';
import styles from './style.module.css';

export default class SuggestedServiceSpec extends React.Component {
    render() {
      return(
      <Card style={{ padding: 20 }}>
        <Grid container spacing={24} className={styles.grid}>
          <Grid item xs={12}>
            <Typography variant="subheading" style={{ fontSize: 20 }}>Suggested</Typography>                    
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subheading">CPU</Typography>
            <Typography variant="body2">(millicpus)</Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField value={this.props.suggestedServiceSpec.cpuRequest} label={"Request"} disabled fullWidth={true} />
          </Grid>
          <Grid item xs={6}>
            <TextField value={this.props.suggestedServiceSpec.cpuLimit} label={"Limit"} disabled fullWidth={true} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subheading">Memory</Typography>
            <Typography variant="body2">(mb)</Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField value={this.props.suggestedServiceSpec.memoryRequest} label={"Request"} disabled fullWidth={true} />
          </Grid>
          <Grid item xs={6}>
            <TextField value={this.props.suggestedServiceSpec.memoryLimit} label={"Limit"} disabled fullWidth={true} />
          </Grid>                      
        </Grid>
      </Card>
      ) 
    }
  }
  