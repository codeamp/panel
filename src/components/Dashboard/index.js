import React from 'react';
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import Grid from 'material-ui/Grid';
import Link from 'react-router-dom/Link';
import Typography from 'material-ui/Typography';
import Card, { CardContent } from 'material-ui/Card';
import Loading from 'components/Utils/Loading';
import gql from 'graphql-tag';
import styles from './style.module.css';
import BookmarkedIcon from '@material-ui/icons/Star';

@graphql(gql`
  query {
    projects {
      count
      entries {
        id
        name
        bookmarked
        slug
      }
    }
    releases {
      count
    }
    features {
      count
    }
    users {
      id
    }
  }
`,{
  options: {
    fetchPolicy: 'network-only'
  }
})


@inject("store") @observer

export default class Dashboard extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      anchorEl: undefined,
      open: false,
      expanded: null,
      hover: null,
    };
  }

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
    this.props.store.app.setNavProjects(projects.entries)
  }
  
  handleChange = panel => (event, expanded) => {
    this.setState({
      expanded: expanded ? panel : false,
    });
  }

  copyGitHash(featureHash){
    this.props.store.app.setSnackbar({msg: "Git hash copied: " + featureHash, open: true });
  }  

  render() {
    const { loading, projects, releases, features, users } = this.props.data;
    if(loading || !projects || !releases){
      return <Loading />
    }

    let { expanded } = this.state;
    if (expanded === null) {
      expanded = 0
    }    

    let bookmarkedProjects = projects.entries.filter(function(project){
      return project.bookmarked
    })

    return (
      <div>
        <div className={styles.root}>
          <Grid container spacing={24} className={styles.info}>
            {/* Projects */}
            <Grid item xs={3}>
              <Card className={styles.projectsCard}>
                <CardContent>
                  <Typography variant="headline" component="h2" className={styles.title}>
                    Projects
                  </Typography>
                  <Typography component="headline" className={styles.bigNumber}>
                    {projects.count}
                  </Typography>
                </CardContent>
              </Card>        
            </Grid>
              {/* Features */}
            <Grid item xs={3}>
              <Card className={styles.featuresCard}>
                <CardContent>
                  <Typography variant="headline" component="h2" className={styles.title}>
                    Features
                  </Typography>
                  <Typography component="headline" className={styles.bigNumber}>
                    {features.count}
                  </Typography>
                </CardContent>
              </Card>        
            </Grid>
              {/* Releases */}
            <Grid item xs={3}>
              <Card className={styles.releasesCard}>
                <CardContent>
                  <Typography variant="headline" component="h2" className={styles.title}>
                    Releases
                  </Typography>
                  <Typography component="headline" className={styles.bigNumber}>
                    {releases.count}
                  </Typography>
                </CardContent>
              </Card>        
            </Grid>
              {/* Users */}
            <Grid item xs={3}>
              <Card className={styles.usersCard}>
                <CardContent>
                  <Typography variant="headline" component="h2" className={styles.title}>
                    Users
                  </Typography>
                  <Typography component="headline" className={styles.bigNumber}>
                    {users.length}
                  </Typography>
                </CardContent>
              </Card>        
            </Grid>
          </Grid>                   
        </div>
        <div className={styles.bookmarks}>
          <Grid container spacing={16}>
            <Grid item xs={12}>
              <Card style={{userSelect:"none"}}>
                <CardContent>                      
                  <Typography variant="title">
                    Bookmarked Projects
                  </Typography>              
                </CardContent>
              </Card>            
              {bookmarkedProjects.length > 0 && projects.entries.map(function(project, idx){
                if (!project.bookmarked) {
                  return null
                }
                return (                  
                  <Card key={project.id} className={styles.bookmarkedProject}>
                    <Link to={"/projects/" + project.slug + "/environments"}>
                      <CardContent
                        tabIndex={-1}
                        key={project.id}
                        history={this.props.history}>
                          <BookmarkedIcon className={styles.bookmarkedProjectGlyph}/>
                          <Typography variant="subheading" style={{"userSelect":"none"}}>
                          {project.name}
                          </Typography>
                      </CardContent>
                    </Link>
                  </Card>
                )
              }, this)}
              {bookmarkedProjects.length === 0 &&
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
    );
  }
}