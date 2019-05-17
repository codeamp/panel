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
import Avatar from '@material-ui/core/Avatar';

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
        releases(params: {limit: 1}) {
          entries {
            id
            state
          }
        }
        features(showDeployed: false, params: { limit: 0 }) {
          count
        }
      }
    }
  }
`, {
  options: (props) => ({
    fetchPolicy: "no-cache"
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

  getLatestReleaseStatus = (releases) => {
    let style = { backgroundColor: "gray", color: "black", marginRight: 5 }

    if (releases.entries.length !== 1) {
      return (<Chip avatar={<Avatar>RS</Avatar>} label="NO RELEASES FOUND" style={style} />)
    }

    switch (releases.entries[0].state) {
      case "waiting":
        style = { backgroundColor: "yellow", color: "black", marginRight: 5 }
        break
      case "complete":
        style = { backgroundColor: "green", color: "white", marginRight: 5 }
        break
      case "failed":
        style = { backgroundColor: "red", color: "white", marginRight: 5 }
        break
      case "canceled":
        style = { backgroundColor: "purple", color: "white", marginRight: 5 }
        break
      default:
        break
    }

    return (<Chip key={releases.entries[0].id+"-release"} avatar={<Avatar>RS</Avatar>} label={releases.entries[0].state} style={style} />)
  }

  render() {
    const { loading, environments } = this.props.data;

    if(loading || !environments){
      return (
        <Loading />
      )
    }      

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
                <Tab key={environment.key+"-tab"} label={environment.name} />
              )
            }, this)}
          </Tabs>
        </Paper>
        <Paper className={styles.tablePaper}>
            <Toolbar>
              <div>
                <Typography variant="title">
                  Projects ({environment.projects.length})
                </Typography>
              </div>
            </Toolbar>
        </Paper>
        <div className={styles.bookmarks}>
          <Grid container spacing={16}>
            <Grid item xs={12}>
              {environment.projects.length > 0 && environment.projects.map(function(project, idx){
                return (                  
                  <Card key={project.id+"-"+environment.key+"-card"} className={styles.bookmarkedProject}>
                    <Link to={"/projects/" + project.slug + "/" + environment.key}>
                      <CardContent
                        tabIndex={-1}
                        key={project.id+"-"+environment.key+"-cardContent"}
                        history={this.props.history}>
                        <Grid container spacing={0}>
                          <Grid item xs={5}>
                            <Typography variant="subheading" style={{"userSelect":"none"}}>
                            { project.bookmarked ? <BookmarkedIcon className={styles.bookmarkedProjectGlyph}/> : null }
                            {project.name}
                            </Typography>
                          </Grid>
                          <Grid item xs={7}>
                            <Typography variant="subheading" align="right">
                              {this.getLatestReleaseStatus(project.releases)}
                              {project.features.count > 0 && <Chip key={project.id+"-"+environment.key+"-features"} avatar={<Avatar>{project.features.count}</Avatar>} label="available features" style={{marginRight: 5}}/>}
                              <Chip key={project.id+"-"+environment.key+"-gitBranch"} label={project.gitBranch} color={project.gitBranch === "master" ? "primary" : "secondary"}/>
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Link>
                  </Card>
                )
              }, this)}
              {environment.projects.length === 0 &&
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