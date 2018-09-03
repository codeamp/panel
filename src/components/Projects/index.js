import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Paper from 'material-ui/Paper';
import Card, { CardContent } from 'material-ui/Card';
import Link from 'react-router-dom/Link';
import Loading from 'components/Utils/Loading';
import styles from './style.module.css';
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import BookmarkedIcon from '@material-ui/icons/Star';

@graphql(gql`
  query AllProjects($projectSearch: ProjectSearchInput){
    projects(projectSearch: $projectSearch){
      entries {
        id
        name
        slug
        bookmarked
        environments {
          id
          name
          key
          __typename
        }
      }  
      count
    }
  }
`, {
  options: (props) => ({
    fetchPolicy: "network-only",
    variables: {
      projectSearch: {
      },
    },
  })
})

@inject("store") @observer
export default class Projects extends React.Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render() {
    const { loading, projects } = this.props.data;

    if(loading || !projects){
      return (
        <Loading />
      )
    }      
    
    return (
      <div>
        <Paper className={styles.tablePaper}>
            <Toolbar>
              <div>
                <Typography variant="title">
                  Projects ({projects.count})
                </Typography>
              </div>
            </Toolbar>
        </Paper>
        <div className={styles.bookmarks}>
          <Grid container spacing={16}>
            <Grid item xs={12}>
              {projects.entries.length > 0 && projects.entries.map(function(project, idx){
                return (                  
                  <Card key={project.id} className={styles.bookmarkedProject}>
                    <Link to={"/projects/" + project.slug + "/environments"}>
                      <CardContent
                        tabIndex={-1}
                        key={project.id}
                        history={this.props.history}>
                          <Typography variant="subheading" style={{"userSelect":"none"}}>
                          { project.bookmarked ? <BookmarkedIcon className={styles.bookmarkedProjectGlyph}/> : null }
                          {project.name}
                          </Typography>
                      </CardContent>
                    </Link>
                  </Card>
                )
              }, this)}
              {projects.entries.length === 0 &&
                <Card style={{padding: 20}}>
                  <Typography variant="subheading" className={styles.bookmarkedProjectsEmpty}>
                    There are no bookmarked projects.
                  </Typography>
                </Card>
              }
            </Grid>        
          </Grid>

        </div>
      
      </div>
    )
  }

}

