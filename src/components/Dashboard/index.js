import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Button from 'material-ui/Button';
import { Link } from "react-router-dom";
import map from 'lodash/map';

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
    this.props.store.app.leftNavItems = [] 
    map(this.props.projects, (project)=>{
      this.props.store.app.leftNavItems.push({
        key: project.id,
        name: project.name,
        slug: "/projects/"+project.slug,
      })
    });
  }

  render() {
    return (
      <div className={styles.root}>
        <Link to="/login">
          <Button raised>
            Login
          </Button>
        </Link>
      </div>
    );
  }
}
