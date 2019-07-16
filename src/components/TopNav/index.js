import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import TextField from 'material-ui/TextField';
import Grid from 'material-ui/Grid';
import Menu, { MenuItem } from 'material-ui/Menu';
import Paper from 'material-ui/Paper';
import { ListItem, ListItemText } from 'material-ui/List';
import { LinearProgress } from 'material-ui/Progress';
import { graphql, withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import Button from 'material-ui/Button';
import _ from "lodash"
import Logo from './logo_white.png';
import styles from './style.module.css';
import Link from 'react-router-dom/Link';
import ReactDOM from 'react-dom';

const GET_PROJECTS = gql`
  query Projects($projectSearch: ProjectSearchInput){
    projects(projectSearch: $projectSearch){
      entries {
        id
        name
        slug
        repository
        bookmarked
        environments {
          id
          name
          color
        }
      }
    }
  }
`

@inject("store") @observer
@graphql(GET_PROJECTS, {
  options: (props) => ({
    fetchPolicy: "network-only",
    variables: {
      projectSearch: {
        bookmarked: true
      }
    }
  })
})

class TopNav extends React.Component {
  timeout = null;
  state = {
    userAnchorEl: undefined,
    value: '',
    hovering: false,
    projects: [],
    projectQuery: '',
    selectedSuggestionIndex: 0,
    timeout: null,
  };

  handleUserClick = event => {
    this.setState({ userAnchorEl: event.currentTarget });
  };

  handleUserClose = () => {
    this.setState({ userAnchorEl: null });
  };

  logout = () => {
    this.handleUserClose();
    window.location.href = '/login';
  }

  escapeRegExp(str) {
    return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
  }

  getSuggestions(projectQuery) {
    if(!projectQuery){
      this.props.data.refetch({ projectSearch: { repository: projectQuery, bookmarked: true }})
      return
    }

    const cleanedValue = this.escapeRegExp(projectQuery.trim().toLowerCase());
    
    clearTimeout(this.timeout) 
    if(cleanedValue !== ''){
      this.timeout = setTimeout(() => {
        this.props.data.refetch({ projectSearch: { repository: cleanedValue, bookmarked: false }})
      }, 300)
    }
  }

  renderBookmarks(e){
    this.getSuggestions(this.state.projectQuery)
    this.setState({ showSuggestions: true, selectedSuggestionIndex: 0 })
  }

  hideSuggestions(force=false){
    if(force){
      this.setState({ showSuggestions: false, hovering: false })
      return
    }
    if(!this.state.hovering){
      this.setState({ showSuggestions: false, hovering: false })
    }
  }

  searchBarKeyPressHandler(e){
    switch(e.key){
      case "ArrowUp":
        if(this.state.selectedSuggestionIndex > 0){
          this.setState({ selectedSuggestionIndex: this.state.selectedSuggestionIndex - 1 })
        }
        break;
      case "ArrowDown":
        if(this.state.selectedSuggestionIndex < this.props.data.projects.entries.length - 1){
          this.setState({ selectedSuggestionIndex: this.state.selectedSuggestionIndex + 1})
        }
        break;
      case "Enter":
        if (this.state.selectedSuggestionIndex in this.state.projects) {
          this.onSuggestionItemClick(this.state.projects[this.state.selectedSuggestionIndex])
        }
        break;
      case "Escape":
        this.setState({ showSuggestions: false, hovering: false })
        break;
      default:
      break
    }
  }

  onSuggestionItemClick(suggestion){
    this.props.history.push('/projects/'+suggestion.project.slug)
    this.hideSuggestions(true)
    this.setState({ projectQuery: "" })
  }

  onChange(e){
    this.getSuggestions(e.target.value)
    this.setState({ projectQuery: e.target.value, showSuggestions: true })
  }

  onBlur(e){
    const domNode = ReactDOM.findDOMNode(this)
    if (!domNode || !domNode.contains(e.relatedTarget)) {
        this.hideSuggestions(true)
    }    
  }

  componentWillReceiveProps(nextProps){
    if(_.has(nextProps.data, 'projects')){
      const projects = nextProps.data.projects.entries.map(function(project){
        return { id: project.id, label: project.name, project: project }
      })
      this.setState({ projects: projects })
    }

    if (nextProps.location.pathname !== this.props.location.pathname) {
      this.setState({ projectQuery: "" })
    }
  }

  onMouseEnter(index){
    this.setState({ hovering: true, selectedSuggestionIndex: index })
  }

  onMouseLeave(index){
    this.setState({ hovering: false, selectedSuggestionIndex: null})
  }

  render() {
    var self = this
    const { store } = this.props
    const { app } = this.props.store; 

    return (
      <div>
        <AppBar position="static" className={styles.appBar}>
            <Toolbar>
              <Grid container spacing={24} style={{"borderWidth":"3px"}}>
                <Grid item xs={2}>
                  <NavLink to="/" exact style={{ color: "white" }}>
                    <img src={Logo} alt="Codeamp" className={styles.logo}/>
                  </NavLink>
                </Grid>
                <Grid item xs={6} onBlur={(e)=>this.onBlur(e)}>
                  <div style={{position: "relative"}}>
                  <TextField
                    fullWidth={true}
                    className={styles.searchInput}
                    autoFocus={false}
                    value={this.state.projectQuery}
                    placeholder="Search..."
                    InputProps={{
                      disableUnderline: true,
                      classes: {
                        root: styles.textFieldRoot,
                        input: styles.textFieldInput,
                      },
                    }}
                    InputLabelProps={{
                      shrink: true,
                      className: styles.textFieldFormLabel,
                    }}
                    onKeyUp={(e) => this.searchBarKeyPressHandler(e)}
                    onClick={(e)=>this.renderBookmarks(e)}
                    onChange={(e)=>this.onChange(e)}
                    
                  />
                  <div tabIndex="0" className={self.state.showSuggestions ? styles.suggestions : styles.showNone}>
                    {self.state.projects.map(function(project, index){
                      return (
                        <Link 
                        key={"link-" + project.id}
                        to={"/projects/" + project.project.slug}
                        onClick = {(e)=>self.hideSuggestions(true)}>
                          <Paper
                            key={project.id}
                            className={index === self.state.selectedSuggestionIndex ? styles.selectedSuggestion : styles.suggestion}
                            square={true}>
                            <ListItem
                              onMouseEnter={() => self.onMouseEnter(index)}
                              onMouseLeave={() => self.onMouseLeave(index)}
                              onClick={()=>self.onSuggestionItemClick(project)}>                  
                                <ListItemText primary={project.label} style={{"userSelect":"none"}}/>                            
                            </ListItem>
                          </Paper>
                        </Link>
                      )
                    })}
                    </div>
                  </div>
                </Grid>

                <Grid item xs={4} style={{textAlign: "right"}}>
                  <Button
                    style={{margin: "0 8px"}}
                    variant="raised"
                    aria-owns={this.state.anchorEl ? 'user-menu' : null}
                    aria-haspopup="true"
                    onClick={this.handleUserClick}>
                    {store.app.user.profile.email}
                  </Button>
                  <Menu
                    id="user-menu"
                    anchorEl={this.state.userAnchorEl}
                    open={Boolean(this.state.userAnchorEl)}
                    onClose={this.handleUserClose}>
                    <MenuItem onClick={this.logout}>Logout</MenuItem>
                  </Menu>
                </Grid>
              </Grid>
            </Toolbar> 

          <Switch>
            <Route path='/projects/:slug/:environment' render={(props) => (
              <div style={{ border: "3px solid " + app.currentEnvironment.color }}></div>
            )} />
          </Switch>
        </AppBar>

        {store.app.connectionHeader.msg !== "" &&
            <AppBar position="absolute" color="default">
              <Toolbar>
                  <Grid container spacin={24}>
                      <Grid item xs={1}>
                      <Typography variant="body1">
                          <a href={window.location.href}>
                          try refreshing
                          </a>
                      </Typography>
                      </Grid>
                      <Grid item xs={11} className={styles.center}>
                          <Typography>
                              { store.app.connectionHeader.msg }
                          </Typography>
                      </Grid>
                  </Grid>
              </Toolbar>
              <LinearProgress color="accent" />
            </AppBar>
        }
      </div>
    );
  }
}

export default withApollo(TopNav)