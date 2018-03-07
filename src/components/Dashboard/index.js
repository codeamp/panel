import React from 'react';
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import styles from './style.module.css';

@graphql(gql`
  query {
    projects {
      id
    }
    releases {
      id
      state
    }
  }
`,{
  options: {
    fetchPolicy: 'cache-and-network'
  }
})


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
