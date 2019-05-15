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
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Chip from '@material-ui/core/Chip';

@graphql(gql`
  query{
    environments{
      id
      name
      key
      projects{
        id
        name
        slug
        bookmarked
        gitBranch
      }
    }
  }
`, {
  options: (props) => ({
    fetchPolicy: "network-only"
  })
})

@inject("store") @observer
export default class Projects extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      value: 0
    }
  }

  handleChange = (event, value) => {
    this.setState({ value });
  };

  render() {
    const { loading, environments } = this.props.data;

    if(loading || !environments){
      return (
        <Loading />
      )
    }      

    var projects = environments[this.state.value].projects
    var environment = environments[this.state.value]
    
    return (
      <div>
        <Paper>
          <Tabs
            value={this.state.value}
            onChange={this.handleChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            {environments.length > 0 && environments.map((environment, idx) => {
              return (                  
                <Tab label={environment.name} />
              )
            }, this)}
          </Tabs>
        </Paper>
        <Paper className={styles.tablePaper}>
            <Toolbar>
              <div>
                <Typography variant="title">
                  Projects ({projects.length})
                </Typography>
              </div>
            </Toolbar>
        </Paper>
        <div className={styles.bookmarks}>
          <Grid container spacing={16}>
            <Grid item xs={12}>
              {projects.length > 0 && projects.map(function(project, idx){
                return (                  
                  <Card key={project.id} className={styles.bookmarkedProject}>
                    <Link to={"/projects/" + project.slug + "/" + environment.key}>
                      <CardContent
                        tabIndex={-1}
                        key={project.id}
                        history={this.props.history}>
                        <Grid container spacing={0}>
                          <Grid item xs={8}>
                            <Typography variant="subheading" style={{"userSelect":"none"}}>
                            { project.bookmarked ? <BookmarkedIcon className={styles.bookmarkedProjectGlyph}/> : null }
                            {project.name}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="subheading" align="right">
                              <Chip label={project.gitBranch} color={project.gitBranch === "master" ? "primary" : "secondary"}/>
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Link>
                  </Card>
                )
              }, this)}
              {projects.length === 0 &&
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

