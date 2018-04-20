import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Typography from 'material-ui/Typography';
import Card, { CardContent } from 'material-ui/Card';
import { NavLink } from 'react-router-dom';
import Button from 'material-ui/Button';
//import IconButton from 'material-ui/IconButton';
import Grid from 'material-ui/Grid';
import { graphql } from 'react-apollo';
import Loading from 'components/Utils/Loading';
import gql from 'graphql-tag';
import ExpansionPanel, {
  //  ExpansionPanelDetails,
  ExpansionPanelSummary,
  ExpansionPanelActions,
} from 'material-ui/ExpansionPanel';
import ExtensionStateCompleteIcon from 'material-ui-icons/CheckCircle';
import ExtensionStateFailedIcon from 'material-ui-icons/Error';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import Divider from 'material-ui/Divider';

class InitPublicProjectComponent extends React.Component {
  render() {
    return (
      <Card className={styles.card} raised={false}>
        <CardContent className={styles.progress}>
          <Typography type="subheading" component="h3" style={{ color: "gray" }}>
            Currently pulling features down
          </Typography>
          <br/>
          <Loading />
        </CardContent>
      </Card>
    )
  }
}

@inject("store") @observer

@graphql(gql`
  query Project($slug: String, $environmentID: String){
    project(slug: $slug, environmentID: $environmentID) {
      id
      name
      slug
      rsaPublicKey
      gitProtocol
      gitUrl
      gitBranch
      features {
        id
        message
        user
        hash
        parentHash
        ref
        created
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
        state
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
      environmentID: props.store.app.currentEnvironment.id,
    }
  })
})

@graphql(gql`
mutation Mutation($headFeatureID: String!, $projectID: String!, $environmentID: String!) {
  createRelease(release: { headFeatureID: $headFeatureID, projectID: $projectID, environmentID: $environmentID }) {
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

export default class Features extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      activeFeatureKey: -1,
      disableDeployBtn: false,
      text: 'Deploy',
      expanded: null,
    };
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
      variables: { headFeatureID: feature.id, projectID: project.id, environmentID: this.props.store.app.currentEnvironment.id },
    }).then(({data}) => {
      this.props.data.refetch()
      this.props.history.push(this.props.match.url.replace('features', 'releases'))
    });
  }

  renderFeatureList = (project) => {
    if(project.features.length === 0){
      return (
        <div>
        <ExpansionPanel expanded={true}>
          <ExpansionPanelSummary>
            <Grid item xs={12}>
              <Typography variant="subheading" style={{ textAlign: "center", fontWeight: 500, fontSize: 23, color: "gray" }}>
                There are no new features to deploy.
              </Typography>
              <Typography variant="body1" style={{ textAlign: "center", fontSize: 16, color: "gray" }}>
                Make sure all relevant features are pushed into {project.gitBranch}. 
                {project.gitProtocol === "SSH" &&
                  <div>
                  If you haven't done so already, <NavLink to={"/projects/" + project.slug + "/settings"}><strong> make sure your deploy key is added in your git settings.</strong></NavLink>
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
      expanded = project.features[0].id
    }

    return (
      <div>
        {project.features.map((feature, idx) => {
            if(!project.currentRelease || new Date(feature.created).getTime() >= new Date(project.currentRelease.headFeature.created).getTime()){
                return (<ExpansionPanel 
                    key={feature.id} expanded={expanded === feature.id} onChange={this.handleChange(feature.id)}> 
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}> 
                    <div> 
                    <Typography variant="body1" style={{ fontSize: 14 }}> <b> { feature.message } </b> </Typography> 
                    <Typography variant="body2" style={{ fontSize: 12 }}> { feature.user } created on { new Date(feature.created).toDateString() } at { new Date(feature.created).toTimeString() } </Typography> </div>
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
            } else {
                return (<div></div>)
            }
        })}
      </div>
      )
  }

  renderDeployedFeatureList = (project) => {
    if(project.releases.length === 0){
      return (
        <div>
          <ExpansionPanel expanded={true}>
            <ExpansionPanelSummary>
              <Grid item xs={12}>
              <Typography variant="subheading" style={{ textAlign: "center", fontWeight: 500, fontSize: 23, color: "gray" }}>
                No features deployed yet.
              </Typography>      
              </Grid>    
            </ExpansionPanelSummary>      
          </ExpansionPanel>
        </div>
        )      
    }

    let { expanded } = this.state;
    if (expanded === null) {
      expanded = project.releases[0].headFeature.id
    }

    // get distinct features from releases
    var distinctFeatures = {}
    const deployedFeatures = project.releases.filter(function(release){
      if(distinctFeatures[release.headFeature.id]){
        return false
      }
      distinctFeatures[release.headFeature.id] = release.headFeature
      return true
    })


    return (
      <div>
        {deployedFeatures.map((release, idx) => {
        return (<ExpansionPanel 
            key={release.headFeature.id} expanded={expanded === release.headFeature.id} onChange={this.handleChange(release.headFeature.id)}> 
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}> 
            <div> 
              {release.state === 'waiting' && <div key={"waiting"+release.id} className=  {styles.innerWaiting}></div>}  
              {release.state === 'failed' && <div key={"failed"+release.id} className={styles.innerFailed}></div>}
              {release.state === 'complete' && <div key={"complete"+release.id} className={styles.innerComplete}></div>}

              <Typography variant="body1" style={{ fontSize: 14 }}> <b> { release.headFeature.message } </b> </Typography> 
              <Typography variant="body2" style={{ fontSize: 12 }}>{ release.headFeature.user } created on { new Date(release.headFeature.created).toDateString() } at { new Date(release.headFeature.created).toTimeString() } </Typography> </div>
                </ExpansionPanelSummary>
                <Divider />
                <ExpansionPanelActions>
                  <CopyToClipboard text={release.headFeature.hash} onCopy={() => this.copyGitHash(release.headFeature.hash)}>
                    <Button color="primary" size="small">
                      Copy Git Hash
                    </Button>
                  </CopyToClipboard>       
                  <Button color="primary" size="small"
                    disabled={this.state.disabledDeployBtn || project.extensions.length === 0}
                    onClick={this.handleDeploy.bind(this, release.headFeature, project)}>
                    { this.state.text }
                  </Button>
                </ExpansionPanelActions>
              </ExpansionPanel>)
              })}
            </div>
      )    
  }

  componentWillMount(){
    this.setupSocketHandlers();
  }

  setupSocketHandlers(){
    const { socket, match } = this.props;
    socket.on(match.url.substring(1, match.url.length), (data) => {
      this.props.data.refetch()
    });
  }

  componentWillUpdate(nextProps, nextState){

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
                  New Features
                </Typography>
              </CardContent>
            </Card>            
            {this.renderFeatureList(project)}            
          </Grid>
          <Grid item xs={12}>
            <hr/>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="title">
                  Deployed Features
                </Typography>
              </CardContent>
            </Card>            
            {this.renderDeployedFeatureList(project)}
          </Grid>          
        </Grid>
      </div>
    );
  }
}
