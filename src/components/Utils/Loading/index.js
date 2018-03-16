import React from 'react';
import Grid from 'material-ui/Grid';
import { CircularProgress } from 'material-ui/Progress';

export default class Loading extends React.Component { 
  render() {
    var { size } = this.props;
    if(!size){
      size = 50
    }
    return (
      <Grid container justify="center" alignItems="center">
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <CircularProgress size={size} />
        </Grid>
      </Grid>          
    )        
  }
}
