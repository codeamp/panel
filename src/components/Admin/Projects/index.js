import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import InputField from 'components/Form/input-field';
import Checkbox from 'material-ui/Checkbox';
import { FormControlLabel } from 'material-ui/Form';
import Loading from 'components/Utils/Loading';
import styles from './style.module.css';
import { observer, inject } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { check } from 'graphql-anywhere';


@graphql(gql`
  query Projects($projectSearch: ProjectSearchInput){
    projects(projectSearch: $projectSearch){
      id
      name
      slug
      environments {
        id
        name
        color
      }
    }
    environments {
      id
      name
      color
    }
  }
`, {
	options: (props) => ({
		variables: {
			projectSearch: {
				repository: "",
        bookmarked: false,
			}
		}
	})
})

@graphql(gql`
mutation DeployProjects($projects: [ProjectInput], $deployableEnvironments: [EnvironmentInput]) {
  deployProjects(batch:{
    projects: $projects,
    deployableEnvironments: $deployableEnvironments,
  })
}
` , { name: "deployProjects" })


@inject("store") @observer
@observer
export default class Projects extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      saving: false,
      drawerOpen: false,
      dialogOpen: false,
      checkedProjects: [],
      checkedEnvs: [],
    }
  }

  onSubmit(e) {
    this.setState({ saving: true })
    this.onSuccess(this.form)
  }

  openDrawer(){
    this.setState({ drawerOpen: true, saving: false });
  }

  closeDrawer(){
    this.form = null
    this.setState({ drawerOpen: false, saving: false, dialogOpen: false })
  }

  selectAllProjects(e){
    const allProjects = this.props.data.projects.map(function(project){
      return project.id
    })
    if(e.target.checked){
      this.setState({ checkedProjects: allProjects })
    } else {
      this.setState({ checkedProjects: [] })
    }
  }

  toggleCheckedProject(project) {
    let checkedProjects = this.state.checkedProjects
    if(checkedProjects.includes(project.id)){
      checkedProjects.splice(checkedProjects.indexOf(project.id), 1)
    } else {
      checkedProjects.push(project.id)
    }

    this.setState({ checkedProjects: checkedProjects })
  }
  
  toggleCheckedEnv(env) {
    let checkedEnvs = this.state.checkedEnvs
    if(checkedEnvs.includes(env.id)){
      checkedEnvs.splice(checkedEnvs.indexOf(env.id), 1)
    } else {
      checkedEnvs.push(env.id)
    }

    this.setState({ checkedEnvs: checkedEnvs })
  }

  onBatchDeploy(){
    this.props.deployProjects({
      variables: {
        projects: this.state.checkedProjects,
        deployableEnvironments: this.state.checkedEnvs,
      },
    }).then(({data}) => {
      this.props.data.refetch()
      this.props.store.app.setSnackbarMsg({ open: true, msg: "Batch deploys have been sent out."})
    });
  }
  
  render() {
    const { loading, projects, environments } = this.props.data;

    if(loading){
      return (
        <Loading />
      )
    }

    var self = this;
    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <div>
              <Typography variant="title">
                Projects
              </Typography>
            </div>
          </Toolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Checkbox
                    onClick={(e) => {this.selectAllProjects(e)} }
                  />
                </TableCell>
                <TableCell>
                  Name
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map(function(project, idx){
                return (
                  <TableRow
                    tabIndex={-1}
                    key={project.id}>
                    <TableCell>
                      <Checkbox 
                        onClick={() => {self.toggleCheckedProject(project)} }
                        checked={ self.state.checkedProjects.includes(project.id) } />
                    </TableCell>
                    <TableCell>
                      {project.name}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
        <Paper style={{ marginTop: 20, padding: 20 }}>
          <Grid container>
            <Grid item xs={4}>
            <Typography variant="subheading">
              Deploy to selected environments:
            </Typography>
            {environments.map(function(env, idx){
                return (
                  <div>
                  <FormControlLabel
                    key={env.id}
                    control={
                      <Checkbox 
                        onClick={() => {self.toggleCheckedEnv(env)}}
                        checked={self.state.checkedEnvs.includes(env.id)} 
                        label={env.name} 
                      />
                    }
                    label={env.name}
                  />    
                  </div>              
                )
              })}     
              <br/><br/>
              <Button 
                onClick={this.onBatchDeploy.bind(this)}
                variant="raised" color="primary">
                Deploy
              </Button>
            </Grid>
            <Grid item xs={8}>
              <Typography variant="subheading"> Deploy Log </Typography>
              <div style={{ border: "1px solid black ", minWidth: "90%", height: 200, padding: 15 }}>
              </div>
            </Grid>    
          </Grid>   
        </Paper>
      </div>
    )
  }

}
