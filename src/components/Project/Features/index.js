import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Typography from 'material-ui/Typography';
import Card, { CardContent } from 'material-ui/Card';
import { CircularProgress } from 'material-ui/Progress';
import { NavLink } from 'react-router-dom';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Grid from 'material-ui/Grid';
import { graphql } from 'react-apollo';
import Loading from 'components/Utils/Loading';
import gql from 'graphql-tag';
import ExpansionPanel, {
  //  ExpansionPanelDetails,
  ExpansionPanelSummary,
  ExpansionPanelActions,
} from 'material-ui/ExpansionPanel';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CachedIcon from '@material-ui/icons/Cached';
import Divider from 'material-ui/Divider';
import { MenuItem } from 'material-ui/Menu';
import { FormControl } from 'material-ui/Form';
import Select from 'material-ui/Select';
import jstz from 'jstimezonedetect';
import moment from 'moment';
import 'moment-timezone';

@inject("store") @observer

@graphql(gql`
  query Project($slug: String, $environmentID: String, $showDeployed: Boolean){
    project(slug: $slug, environmentID: $environmentID) {
      id
      name
      slug
      rsaPublicKey
      gitProtocol
      gitUrl
      gitBranch
      features(showDeployed: $showDeployed, params: { limit: 25 }) {
        entries {
          id
          message
          user
          hash
          parentHash
          ref
          created
        }
      }
      releases(params: { limit: 25}) {
        entries {
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
          state
        }
      }
      extensions {
        id
      }
    }
  }
`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.environment.id,
      showDeployed: props.store.app.features.showDeployed,
    }
  })
})

@graphql(gql`
mutation Mutation($headFeatureID: String!, $projectID: String!, $environmentID: String!, $forceRebuild: Boolean!) {
  createRelease(release: { headFeatureID: $headFeatureID, projectID: $projectID, environmentID: $environmentID, forceRebuild: $forceRebuild }) {
    headFeature {
      message
    }
    tailFeature  {
      message
    }
    state
    stateMessage
  }
}
`, { name: "createRelease" })

@graphql(gql`
mutation Mutation($projectID: ID!, $environmentID: ID!, $new: Boolean) {
  getGitCommits(projectID: $projectID, environmentID: $environmentID, new: $new)
}
`, { name: "getGitCommits" })

export default class Features extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      activeFeatureKey: -1,
      disableDeployBtn: false,
      text: 'Deploy',
      expanded: null,
      filterOpen: false,
      filter: "new",
      showDeployed: false,
      syncingCommits: false,
    };

    this.setFilterAndRefetchFeatures.bind(this);
    this.setupSocketHandlers();
  }

  handleChange = panel => (event, expanded) => {
    this.setState({
      expanded: expanded ? panel : false,
    });
  };

  copyGitHash(featureHash){
    this.props.store.app.setSnackbar({msg: "Git hash copied: " + featureHash, open: true });
  }

  handleDeploy(feature, project){
    this.setState({ disabledDeployBtn: true, text: 'Deploying'})
    this.props.createRelease({
      variables: { 
        headFeatureID: feature.id, 
        projectID: project.id, 
        environmentID: this.props.store.app.currentEnvironment.id,
        forceRebuild: true,
      },
    }).then(({data}) => {
      this.props.data.refetch()
      this.props.history.push(`/projects/${this.props.match.params.slug}/${this.props.match.params.environment}/releases`)
    });
  }

  renderFeatureList = (project) => {
    if(project.features.entries.length === 0){
      return (
        <div>          
        <ExpansionPanel expanded={true}>
          <ExpansionPanelSummary>
            <Grid item xs={12}>
              {this.state.filter === "new" &&
                <Typography variant="subheading" style={{ textAlign: "center", fontWeight: 500, fontSize: 23, color: "gray" }}>
                  There are no new features to deploy.
                </Typography>
              }
              <Typography variant="body1" style={{ textAlign: "center", fontSize: 16, color: "gray" }}>
                Make sure all relevant features are pushed into {project.gitBranch}. 
                {project.gitProtocol === "SSH" &&
                  <div>
                  If you haven't done so already, <NavLink to={"/projects/" + project.slug + "/" + this.props.store.app.currentEnvironment.name + "/settings"}><strong> make sure your deploy key is added in your git settings.</strong></NavLink>
                  </div>
                }
              </Typography>               
            </Grid>
          </ExpansionPanelSummary>                       
        </ExpansionPanel>
        </div>
        )
    }

    let { expanded } = this.state;
    if (expanded === null) {
      expanded = project.features.entries[0].id
    }

    return (
      <div> 
        {project.features.entries.map((feature, idx) => {
          //Thu Jul 05 2018 13:55:44 (PST)
          let featureMoment = moment(new Date(feature.created))
          let featureTime = featureMoment.format("ddd, MMM Do, YYYY HH:mm:ss") + " (" + moment.tz(jstz.determine().name()).format('z') + ")"
          return (<ExpansionPanel 
              key={feature.id} expanded={expanded === feature.id} onChange={this.handleChange(feature.id)}> 
              <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}> 
              <div> 
              <Typography variant="body1" style={{ fontSize: 14 }}> <b> { feature.message } </b> </Typography> 
              <Typography variant="body2" style={{ fontSize: 12 }}> { feature.user } created on { featureTime } </Typography> </div>
            </ExpansionPanelSummary>
            <Divider />
            <ExpansionPanelActions>
              <CopyToClipboard text={feature.hash} onCopy={() => this.copyGitHash(feature.hash)}>
                <Button color="primary" size="small">
                  Copy Git Hash
                </Button>
              </CopyToClipboard>       
              <Button color="primary" size="small"
                disabled={this.state.disabledDeployBtn || project.extensions.length === 0}
                onClick={this.handleDeploy.bind(this, feature, project)}>
                { this.state.text }
              </Button>
            </ExpansionPanelActions>
          </ExpansionPanel>)         
        })}
      </div>
      )
  }
  
  syncGitCommits() {
    const { project } = this.props.data;
    var self = this
    
    this.setState({ syncingCommits: true })

    this.props.getGitCommits({
      variables: {
        projectID: project.id, 
        environmentID: this.props.store.app.currentEnvironment.id,        
        new: true,
      }
    }).then(function(data){
      setTimeout(function(){
        self.props.data.refetch()
        self.setState({ syncingCommits: false })
      }, 2000)      
    })
  }

  setFilterAndRefetchFeatures(e) {
    let showDeployed = false
    if(e.target.value === "all") {
      showDeployed = true
      this.props.data.refetch({
        slug: this.props.match.params.slug,
        environmentID: this.props.store.app.currentEnvironment.id, 
        showDeployed: showDeployed,
      });
    } else {
      this.props.data.refetch({
        slug: this.props.match.params.slug,
        environmentID: this.props.store.app.currentEnvironment.id, 
        showDeployed: showDeployed,
      });      
    }
    this.setState({ filter: e.target.value })
    this.props.store.app.setFeatures({ showDeployed: showDeployed })
  }

  setupSocketHandlers(){
    const { socket, match } = this.props;
    socket.on(match.url.substring(1, match.url.length) + '/features', (data) => {
      this.props.data.refetch()
    });    
  }

  render() {
    const { loading, project } = this.props.data;

    if(loading){
      return (
        <Loading />
      );
    }

    return (
      <div className={styles.root}>
        <Grid container spacing={16}>
          <Grid item xs={12}>
            <Card>
              <CardContent>                      
                <Typography variant="title">
                  Features
                  <form autoComplete="off" style={{ display: "inline-block", float: "right" }}>                 
                    <IconButton 
                      onClick={this.syncGitCommits.bind(this)}
                      style={{ display: "inline-block", marginRight: 20}}>
                      {this.state.syncingCommits ? (<CircularProgress />) : (<CachedIcon/>)}
                    </IconButton>                                      
                    <FormControl>
                      <Select
                        open={this.state.filterOpen}
                        onClose={() => {this.setState({ filterOpen: false })}}
                        onOpen={() => {this.setState({ filterOpen: true })}}
                        value={this.state.filter}
                        onChange={(e) => {this.setFilterAndRefetchFeatures(e)} }
                        inputProps={{
                          name: 'featureFilter',
                        }}
                      >
                        <MenuItem value={"new"}>New</MenuItem>
                        <MenuItem value={"all"}>All</MenuItem>
                      </Select>
                    </FormControl>
                  </form>                         
                </Typography>              
              </CardContent>
            </Card>            
            {this.renderFeatureList(project)}            
          </Grid>        
        </Grid>
      </div>
    );
  }
}
