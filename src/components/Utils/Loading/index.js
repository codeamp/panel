import React from 'react';
import Grid from 'material-ui/Grid';
import { CircularProgress } from 'material-ui/Progress';

export default class Loading extends React.Component {
  render() {
    return (
      <Grid container justify="center" alignItems="center">
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <CircularProgress size={50} />
        </Grid>
      </Grid>          
    )        
  }
}