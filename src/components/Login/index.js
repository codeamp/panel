import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Button from 'material-ui/Button';
import { Link } from "react-router-dom";

@inject("store") @observer

export default class Login extends React.Component {
  render() {
    return (
      <div className={styles.root}>
        <Link to="/">
          <Button raised>
            Home
          </Button>
        </Link>
      </div>
    );
  }
}
