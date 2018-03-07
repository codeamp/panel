import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Typography from 'material-ui/Typography';
import Card, { CardContent } from 'material-ui/Card';
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
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import Divider from 'material-ui/Divider';

class InitPrivateProjectComponent extends React.Component {
  state = {
    open: false,
    message: null,
    expanded: null,
  };

  render() {
    return (
      <Card className={styles.card} raised={false}>
        <CardContent>
          <Typography type="headline" component="h3">
            Setup the Git Deploy Key
          </Typography>
          <br/>
          <Typography
            id="ssh-key"
            component="p" className={styles.codeSnippet}>
            {this.props.rsaPublicKey}
          </Typography>
          <br/><br/>
          <Typography variant="body1">
            <a href="https://developer.github.com/v3/guides/managing-deploy-keys/#deploy-keys">
              Click here to learn how to add deploy keys to Github.
            </a>
          </Typography>
        </CardContent>
      </Card>
    )
  }
}

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
      currentRelease {
        id
        state
        stateMessage
        created
        user {
          email
        }
        headFeature {
          id
          message
          user
          hash
          parentHash
          ref
          created
        }
        tailFeature {
          id
          message
          user
          hash
          parentHash
          ref
          created
        }
      }
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

    let defaultComponent = (<Loading />)
    if(project.features.length > 0) {
      defaultComponent = this.renderFeatureList(project);
    } else if(project.gitProtocol === "SSH"){
        defaultComponent = (<InitPrivateProjectComponent rsaPublicKey={project.rsaPublicKey}/>)
    } else if(project.gitProtocol === "HTTPS"){
        defaultComponent = (<InitPublicProjectComponent />)
    }

    return (
      <div className={styles.root}>
        <Grid container spacing={16}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="title">
                  Features
                </Typography>
              </CardContent>
            </Card>
            {defaultComponent}
          </Grid>
        </Grid>
      </div>
    );
  }
}
