import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';

@inject("store") @observer

export default class Create extends React.Component {
  render() {
    return (
      <div className={styles.root}>
        <Typography>New Project</Typography>
      </div>
    );
  }
}
