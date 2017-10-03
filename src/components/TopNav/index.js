import React from 'react';
import { observer, inject } from 'mobx-react';

import styles from './style.module.css';
import autosuggest from './autosuggest.module.css';

import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import Chip from 'material-ui/Chip';
import Menu, { MenuItem } from 'material-ui/Menu';
import TextField from 'material-ui/TextField';
import Grid from 'material-ui/Grid';
import Paper from 'material-ui/Paper';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';

import StarIcon from 'material-ui-icons/Star';

import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';

import Autosuggest from 'react-autosuggest';

@inject("store") @observer

export default class TopNav extends React.Component {
  state = {
    anchorEl: undefined,
    open: false,
    originalSuggestions: [],    
    suggestions: [],
    value: ''
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

  getSuggestionValue(suggestion) {
    return suggestion.label;
  }  

  getSuggestions(value) {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    console.log(this.state.originalSuggestions)
  
    return inputLength === 0 ? [] : this.state.originalSuggestions.filter(lang =>
      lang.label.toLowerCase().slice(0, inputLength) === inputValue
    );
  }

  renderSuggestions(bookmarksOnly, suggestions){
    if(bookmarksOnly){
      console.log('bookmarksOnly!')
      const bookmarks = this.props.projects.map(function(project){
        return { id: project.id, label: project.name, project: project }
      })      
      this.setState({ suggestions: bookmarks, showSuggestions: true })
    } else {
      this.setState({ suggestions: suggestions, showSuggestions: true })
    }
  }

  hideSuggestions(){
    this.setState({ showSuggestions: false })
  }

  onSuggestionItemClick(suggestion){
    console.log('onSuggestionItemClick')
    console.log(suggestion)
    this.props.history.push('/projects/' + suggestion.project.slug)
    this.hideSuggestions()
  }

  onChange(e){
    console.log(e.target.value);
    const suggestions = this.getSuggestions(e.target.value)
    console.log(suggestions)
    this.renderSuggestions(false, suggestions)
  }
    

  render() {
    var self = this
    return (
      <AppBar position="static" className={styles.appBar}>
        <Toolbar>
          <Grid container>
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
                  onClick={()=>this.renderSuggestions(true)}
                  onChange={this.onChange.bind(this)}
                  placeholder="Search for a project or view your bookmarks"
                  style={{ width: 800 }}
                />            
                <div className={this.state.showSuggestions ? styles.suggestions : styles.showNone}>    
                  {this.state.suggestions.map(function(suggestion){
                    return (
                      <Paper 
                        key={suggestion.id} 
                        className={styles.suggestion}
                        square={true}>
                        <ListItem onClick={()=>self.onSuggestionItemClick(suggestion)}>
                          <ListItemText primary={suggestion.label} />
                          {/* <ListItemIcon>
                            <StarIcon />
                          </ListItemIcon>                         */}
                        </ListItem>                      
                      </Paper>
                    )
                  })}
                  </div>
              </div>
            </Grid>
            <Grid item xs={2}>      
              <Chip 
                label="saso@checkr.com" 
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
    );
  }
}
