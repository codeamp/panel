import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';

@inject("store") @observer

export default class ServiceSpecs extends React.Component {

  componentWillMount(){
    console.log("FOUND!")
  }

  render() {
    console.log(this.props)

    return (
      <div className={styles.root}>
        hello
      </div>
    );
  }
}
