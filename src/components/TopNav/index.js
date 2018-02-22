import React from 'react';
import { observer, inject } from 'mobx-react';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Chip from 'material-ui/Chip';
import Select from 'material-ui/Select';
import Menu, { MenuItem } from 'material-ui/Menu';
import TextField from 'material-ui/TextField';
import Grid from 'material-ui/Grid';
import Paper from 'material-ui/Paper';
import { ListItem, ListItemText } from 'material-ui/List';
import { LinearProgress } from 'material-ui/Progress';
import { FormControl } from 'material-ui/Form';

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
    anchorEl: undefined,
    open: false,
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

  handleClick = event => {
    this.setState({ open: true, anchorEl: event.currentTarget });
  };

  handleRequestClose = () => {
    this.setState({ open: false });
  };

  logout = () => {
    this.handleRequestClose();
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
    this.props.history.push('/projects/' + suggestion.project.slug)
    this.hideSuggestions(true)
  }

  onChange(e){
    const suggestions = this.getSuggestions(e.target.value)
    this.setState({ suggestions: suggestions, showSuggestions: true })
  }

  handleEnvChange(e){
  	const { environments } = this.props.data;
  	var color = "gray"

    environments.map(function(env){
    	if(env.id === e.target.value){
    		color = env.color
        return
      }
    })

    this.props.store.app.setCurrentEnv({id: e.target.value, color: color })
    return
  }

  render() {
    var self = this
    const { store } = this.props
	const { loading, environments } = this.props.data;
    const { app } = this.props.store;

	if(loading){
		return (<div>Loading</div>)
	}


    return (
    <div>
      <AppBar position="static" className={styles.appBar}>
        <Toolbar>
          <Grid container spacing={24}>
            <Grid item xs={2}>
              <Typography variant="title" color="inherit">
                CodeAmp
              </Typography>
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
            <Grid item xs={2}>
              <Chip
                label={store.app.user.profile.email}
                onClick={this.handleClick}
                aria-owns={this.state.open ? 'simple-menu' : null}
                aria-haspopup="true"
              />
            </Grid>
			{window.location.href.includes('projects') &&
				<Grid item xs={2}>
				  <FormControl>

					<Select
					  classes={{
  						select: styles.currentEnv,
  						root: styles.currentEnv,
					  }}
					  style={{ width: 200 }}

					  fullWidth={true}
					  value={this.props.store.app.currentEnvironment.id}
					  onChange={this.handleEnvChange.bind(this)}
					  inputProps={{
						name: 'age',
						id: 'age-simple',
					  }}
					>
					  {environments.map(function(env){
						return (
							<MenuItem value={env.id}>{env.name}</MenuItem>
						)
					  })}
				  </Select>
				 </FormControl>
				</Grid>
			}
          </Grid>
          <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={this.state.open}
            onRequestClose={this.handleRequestClose}
          >
            <MenuItem onClick={this.logout}>Logout</MenuItem>
          </Menu>
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
