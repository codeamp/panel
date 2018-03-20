import React from 'react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';

export default class DoesNotExist404 extends React.Component {
  
  render() {
    return (
      <div className={styles.root}>
        <Typography className={styles.title} variant="title"> 404 Not Found </Typography>
        <Typography className={styles.caption} variant="caption"> The page you're looking for cannot be found. Please check your URL or go back to the home page.</Typography>
      </div>
    );
  }
}
