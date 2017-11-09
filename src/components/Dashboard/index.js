import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Button from 'material-ui/Button';
import { Link } from "react-router-dom";

@inject("store") @observer

export default class Dashboard extends React.Component {
  state = {
    anchorEl: undefined,
    open: false,
  };

  handleClick = event => {
    this.setState({ open: true, anchorEl: event.currentTarget });
  };

  handleRequestClose = () => {
    this.setState({ open: false });
  };

  componentWillMount() {
    this.props.store.app.setNavProjects(this.props.projects)
  }

  componentWillReact() {
    const { projects } = this.props.data;
    this.props.store.app.setNavProjects(projects)
  }

  render() {
    return (
      <div className={styles.root}>
      </div>
    );
  }
}
