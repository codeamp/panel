import React from 'react';
import { NavLink } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Menu, { MenuItem } from 'material-ui/Menu';
import TextField from 'material-ui/TextField';
import Grid from 'material-ui/Grid';
import Paper from 'material-ui/Paper';
import { ListItem, ListItemText } from 'material-ui/List';
import { LinearProgress } from 'material-ui/Progress';
import Button from 'material-ui/Button';
import Loading from 'components/Utils/Loading';
import Logo from './logo_white.png';

import styles from './style.module.css';

import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

@graphql(gql`
         query {
           environments {
             id
             name
             color
             created
           }
         }
`)

@inject("store") @observer
export default class TopNav extends React.Component {
  state = {
    userAnchorEl: undefined,
    environmentAnchorEl: undefined,
    originalSuggestions: [],
    suggestions: [],
    value: '',
    hovering: false,
  };

  componentDidMount(){
    const originalSuggestions = this.props.projects.map(function(project){
        return { id: project.id, label: project.name, project: project }
    })
    this.setState({ originalSuggestions: originalSuggestions })
  }

  handleUserClick = event => {
    this.setState({ userAnchorEl: event.currentTarget });
  };

  handleEnvironmentClick = event => {
    this.setState({ environmentAnchorEl: event.currentTarget });
  };

  handleUserClose = () => {
    this.setState({ userAnchorEl: null });
  };

  handleEnvironmentClose = (event, id) => {
    this.setState({ environmentAnchorEl: null });
  };

  handleEnvironmentSelect = (id) => {
  	const { environments } = this.props.data;

    environments.map((env) => {
    	if(env.id === id){
        this.props.store.app.setCurrentEnv({id: id, color: env.color, name: env.name })
        return null
      }
      return null
    })

    this.setState({ environmentAnchorEl: null });
  }

  logout = () => {
    this.handleUserClose();
    window.location.href = '/login';
  }

  escapeRegExp(str) {
    return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
  }

  getSuggestions(value) {
    const cleanedValue = this.escapeRegExp(value.trim().toLowerCase());
    let re = new RegExp(cleanedValue, "i");

    return cleanedValue === '' ? [] : this.state.originalSuggestions.filter((project) => {
      return project.label.toLowerCase().match(re)
    });
  }

  renderBookmarks(e){
    let query = e.target.value
    if (query === "") {
      query = "/"
    }
    const suggestions = this.getSuggestions(query)
    this.setState({ suggestions: suggestions, showSuggestions: true })
  }

  hideSuggestions(force=false){
    if(force){
      this.setState({ showSuggestions: false, suggestions: [], hovering: false })
      return
    }
    if(!this.state.hovering){
      this.setState({ showSuggestions: false, suggestions: [], hovering: false })
    }
  }

  onSuggestionItemClick(suggestion){
    if(this.props.data.environments.length > 0){
      this.props.history.push('/projects/' + suggestion.project.slug)      
    } else {
      this.props.store.app.setSnackbar({ msg: "Please create atleast one environment to enter into a project. Message an admin if you can't do that.", open: true })      
    }
    this.hideSuggestions(true)
  }

  onChange(e){
    const suggestions = this.getSuggestions(e.target.value)
    this.setState({ suggestions: suggestions, showSuggestions: true })
  }

  render() {
    var self = this
    const { store } = this.props
    const { loading, environments } = this.props.data;
    const { app } = this.props.store;

    if(loading){
      return (<Loading />)
    }
    
    // make sure mobx env id exists
    var found = false
    environments.map(function(env){
      if(env.id === self.props.store.app.currentEnvironment.id){
        found = true
        return true
      }
      return false
    })
    if(!found){
      if(environments.length > 0) {
        this.props.store.app.setCurrentEnv({id: environments[0].id, color: environments[0].color, name: environments[0].name })
      }
    }

    return (
    <div>
      <AppBar position="static" className={styles.appBar}>
        <Toolbar>
          <Grid container spacing={24}>
            <Grid item xs={2}>
              <NavLink to="/" exact style={{ color: "white" }}>
                <img src={Logo} alt="Codeamp" className={styles.logo}/>
              </NavLink>
            </Grid>
            <Grid item xs={6}>
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
                onClick={(e)=>this.renderBookmarks(e)}
                onChange={(e)=>this.onChange(e)}
                onBlur={(e)=>this.hideSuggestions()}
              />
                <div className={this.state.showSuggestions ? styles.suggestions : styles.showNone}>
                  {this.state.suggestions.map(function(suggestion){
                    return (
                      <Paper
                        key={suggestion.id}
                        className={styles.suggestion}
                        square={true}>
                        <ListItem
                          onMouseEnter={() => self.setState({ hovering: true })}
                          onMouseLeave={() => self.setState({ hovering: false })}
                          onClick={()=>self.onSuggestionItemClick(suggestion)}>
                          <ListItemText primary={suggestion.label} />
                        </ListItem>
                      </Paper>
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
              {window.location.href.includes('projects') &&
                  <span>
                    <Button
                      style={{margin: "0 8px"}}
                      variant="raised"
                      aria-owns={this.state.environmentAnchorEl ? 'environment-menu' : null}
                      aria-haspopup="true"
                      onClick={this.handleEnvironmentClick.bind(this)}>
                      {app.currentEnvironment.name}
                    </Button>
                    <Menu
                      id="environment-menu"
                      anchorEl={this.state.environmentAnchorEl}
                      open={Boolean(this.state.environmentAnchorEl)}
                      onClose={this.handleEnvironmentClose.bind(this)}>
                      {environments.map((env) => {
                      return (<MenuItem 
                        key={env.id}
                        onClick={this.handleEnvironmentSelect.bind(this, env.id)}>
                        {env.name}
                      </MenuItem>)
                      })}
                    </Menu>
                  </span>
              }
            </Grid>
          </Grid>
        </Toolbar>
		{window.location.href.includes('projects') &&
			<div style={{ border: "3px solid " + app.currentEnvironment.color }}>
			</div>
		}
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
