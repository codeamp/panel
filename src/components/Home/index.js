import React from 'react';
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

@inject("store") @observer
@graphql(gql`
  query allProjects {
    projects {
      id
      name
      slug
    }
  }
`)

export default class Home extends React.Component {
  render() {
    const { loading, projects } = this.props.data;

    if (loading) {
      return <div>Loading</div>;
    } else {
      return (
        <ul>
          {projects.map(project =>
          <li key={project.id}>
            {project.name} {" "}
            <span>{project.slug}</span>
          </li>
          )}
        </ul>
      );
    }
  }
}
