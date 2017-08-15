import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Button from 'material-ui/Button';
import { Link } from "react-router-dom";
import Grid from 'material-ui/Grid';

@inject("store") @observer

export default class Login extends React.Component {
  render() {
    return (
      <div className={styles.root}>
        <Grid container spacing={16}>
          <Grid item xs={3}>
          </Grid>
          <Grid item xs={6}>
            <Link to="/">
              <Button raised>
                Home
              </Button>
            </Link>
          </Grid>
          <Grid item xs={3}>
          </Grid>
        </Grid>
      </div>
    );
  }
}
