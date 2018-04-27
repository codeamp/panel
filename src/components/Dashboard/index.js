import React from 'react';
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Card, { CardContent, CardActions } from 'material-ui/Card';
import Loading from 'components/Utils/Loading';
import Button from 'material-ui/Button';
import gql from 'graphql-tag';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { NavLink } from 'react-router-dom';
import ExpansionPanel, {
  ExpansionPanelSummary,
  ExpansionPanelActions,
} from 'material-ui/ExpansionPanel';
import ExtensionStateCompleteIcon from 'material-ui-icons/CheckCircle';
import ExtensionStateFailedIcon from 'material-ui-icons/Error';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import Divider from 'material-ui/Divider';
import styles from './style.module.css';

@graphql(gql`
  query AllObjects($projectSearch: ProjectSearchInput){
    projects(projectSearch: $projectSearch) {
      id
    }
    releases {
      id
      headFeature {
        id
        message
        user
        hash
        parentHash
        ref
        created
      }
      project {
        repository
      }
      state
    }
    features {
      id
    }
    users {
      id
    }
  }
`,{
  options: {
    variables: {
      projectSearch: {
        bookmarked: false,
        repository: "/",
      }
    },
    fetchPolicy: 'network-only'
  }
})


@inject("store") @observer

export default class Dashboard extends React.Component {
  state = {
    anchorEl: undefined,
    open: false,
    expanded: null,
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
    if(loading){
      return <Loading />
    }

    let { expanded } = this.state;
    if (expanded === null) {
      expanded = 0
    }    
    return (
      <div className={styles.root}>
        <Grid container spacing={24} className={styles.info}>
          {/* Projects */}
          <Grid item xs={3}>
            <Card className={styles.projectsCard}>
              <CardContent>
                <Typography variant="headline" component="h2" className={styles.title}>
                  Projects
                </Typography>
                <Typography component="headline" component="h1" className={styles.bigNumber}>
                  {projects.length}
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
                <Typography component="headline" component="h1" className={styles.bigNumber}>
                  {features.length}
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
                <Typography component="headline" component="h1" className={styles.bigNumber}>
                  {releases.length}
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
                <Typography component="headline" component="h1" className={styles.bigNumber}>
                  {users.length}
                </Typography>
              </CardContent>
            </Card>        
          </Grid>
        </Grid>          
        <Grid item xs={12} style={{ margin: 15 }}>
          <hr/>
        </Grid>
        {/* Recent Releases */}
        <Grid item xs={12}>
          <Typography variant="headline" component="h2" style={{ textAlign: "center", marginBottom: 10 }}>
            Recent Releases
          </Typography>           
          {releases.map((release, idx) => {
            return (
                <ExpansionPanel 
                  key={idx} expanded={expanded === idx} onChange={this.handleChange(idx)}> 
                  <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}> 
                  <div> 
                    <Typography variant="body1" style={{ fontSize: 18, marginBottom: 15 }}> { release.project.repository } </Typography>                     
                    {release.state === 'waiting' && <div key={"waiting"+release.id} className=  {styles.innerWaiting}></div>}  
                    {release.state === 'failed' && <div key={"failed"+release.id} className={styles.innerFailed}></div>}
                    {release.state === 'complete' && <div key={"complete"+release.id} className={styles.innerComplete}></div>}

                    <Typography variant="body1" style={{ fontSize: 14 }}> <b> { release.headFeature.message } </b> </Typography> 
                    <Typography variant="body2" style={{ fontSize: 12 }}>{ release.headFeature.user } created on { new Date(release.headFeature.created).toString() } at { new Date(release.headFeature.created).toTimeString() } </Typography> 
                  </div>
                      </ExpansionPanelSummary>
                      <Divider />
                      <ExpansionPanelActions>
                        <CopyToClipboard text={release.headFeature.hash} onCopy={() => this.copyGitHash(release.headFeature.hash)}>
                          <Button color="primary" size="small">
                            Copy Git Hash
                          </Button>
                        </CopyToClipboard>       
                      </ExpansionPanelActions>
                  </ExpansionPanel>
              )
          })}
        </Grid>          
      </div>
    );
  }
}
