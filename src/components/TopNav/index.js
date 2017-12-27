import React from 'react';
import { observer, inject } from 'mobx-react';

import styles from './style.module.css';

import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Chip from 'material-ui/Chip';
import Menu, { MenuItem } from 'material-ui/Menu';
import TextField from 'material-ui/TextField';
import Grid from 'material-ui/Grid';
import Paper from 'material-ui/Paper';
import { ListItem, ListItemText } from 'material-ui/List';
import { LinearProgress } from 'material-ui/Progress';

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

    return cleanedValue === '' ? [] : this.state.originalSuggestions.filter(function(project){
      return project.label.toLowerCase().match(re)
    });
  }

  renderBookmarks(){
    // TODO
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

  render() {
    var self = this
    const { store } = this.props

    return (
    <div>
      <AppBar position="static" className={styles.appBar}>
        <Toolbar>
          <Grid container spacing={24}>
            <Grid item xs={10}>
              <Typography type="title" color="inherit" className={styles.flex}>
                CodeAmp
              </Typography>
            </Grid>
            <Grid item xs={8} style={{ position: 'absolute', left: '15%' }}>
              <div>
                <TextField
                  autoFocus={false}
                  value={this.state.projectQuery}
                  onClick={()=>this.renderBookmarks()}
                  onChange={(e)=>this.onChange(e)}
                  onBlur={()=>this.hideSuggestions() }
                  placeholder="Search for a project or view your bookmarks"
                  style={{ width: 800 }}
                />
                <div
                  className={this.state.showSuggestions ? styles.suggestions : styles.showNone}>
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
          </Grid>
          <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={this.state.open}
            onRequestClose={this.handleRequestClose}
          >
            <MenuItem onClick={this.handleRequestClose}>My account</MenuItem>
            <MenuItem onClick={this.logout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {store.app.connectionHeader.msg !== "" &&
          <AppBar position="absolute" color="default">
            <Toolbar>
                <Grid container spacin={24}>
                    <Grid item xs={1}>
                    <Typography type="body1">
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
