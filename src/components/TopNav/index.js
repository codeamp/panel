import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import MenuIcon from 'material-ui-icons/Menu';
import Chip from 'material-ui/Chip';
import Menu, { MenuItem } from 'material-ui/Menu';
import TextField from 'material-ui/TextField';
import Grid from 'material-ui/Grid';
import Paper from 'material-ui/Paper';
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
      return { label: project.name }
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

  handleSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: this.getSuggestions(value),
    });
  };

  handleSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  handleChange = (event, { newValue }) => {
    this.setState({
      value: newValue,
    });
  };

  getSuggestionValue(suggestion) {
    return suggestion.label;
  }  

  getSuggestions(value) {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    let count = 0;
  
    return inputLength === 0
      ? []
      : this.state.originalSuggestions.filter(suggestion => {
          const keep =
            count < 5 && suggestion.label.toLowerCase().slice(0, inputLength) === inputValue;
  
          if (keep) {
            count += 1;
          }
  
          return keep;
        });
  }
  
  renderSuggestion(suggestion, { query, isHighlighted }) {
    const matches = match(suggestion.label, query);
    const parts = parse(suggestion.label, matches);
  
    return (
      <MenuItem selected={isHighlighted} component="div">
        <div>
          {parts.map((part, index) => {
            return part.highlight ? (
              <span key={index} style={{ fontWeight: 300 }}>
                {part.text}
              </span>
            ) : (
              <strong key={index} style={{ fontWeight: 500 }}>
                {part.text}
              </strong>
            );
          })}
        </div>
      </MenuItem>
    );
  }
  

  renderInput(inputProps){
    console.log('renderInput')
    const { autoFocus, value, ref, ...other } = inputProps;
    
    return (
        <TextField
          autoFocus={autoFocus}
          value={value}
          inputRef={ref}
          InputProps={{
            ...other,
          }}
          style={{ width: 200 }}
        />
      );
  }

  renderSuggestionsContainer(options) {
    const { containerProps, children } = options;
    console.log(options)
    return (
      <Paper {...containerProps} square>
        {children}
      </Paper>
    );
  }

  render() {
    return (
      <AppBar position="static" className={styles.appBar}>
        <Toolbar>
          <Grid container>
            <Grid item xs={10}>
              <Typography type="title" color="inherit" className={styles.flex}>
                CodeAmp
              </Typography>
            </Grid>
            <Grid item xs={8} style={{ position: 'absolute', left: 200, width: '50%' }}>
              <Autosuggest
                renderInputComponent={this.renderInput}
                suggestions={this.state.originalSuggestions}
                onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
                onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
                renderSuggestionsContainer={this.renderSuggestionsContainer}
                getSuggestionValue={this.getSuggestionValue}
                renderSuggestion={this.renderSuggestion}
                inputProps={{
                  autoFocus: true,
                  placeholder: 'Search for a project...',
                  value: this.state.value,
                  onChange: this.handleChange,
                }}
              />    
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
