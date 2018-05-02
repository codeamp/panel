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

  render() {
    const { loading, projects } = this.props.data;

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
      </div>
    )
  }

}
