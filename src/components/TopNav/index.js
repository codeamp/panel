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

@inject("store") @observer

export default class TopNav extends React.Component {
  state = {
    anchorEl: undefined,
    open: false,
  };

  handleClick = event => {
    this.setState({ open: true, anchorEl: event.currentTarget });
  };

  handleRequestClose = () => {
    this.setState({ open: false });
  };

  render() {
    return (
      <AppBar position="static" className={styles.appBar}>
        <Toolbar>
          <IconButton color="contrast" aria-label="Menu">
            <MenuIcon />
          </IconButton>
          <Typography type="title" color="inherit" className={styles.flex}>
            CodeAmp
          </Typography>
          <Chip 
            label="saso@checkr.com" 
            onClick={this.handleClick} 
            aria-owns={this.state.open ? 'simple-menu' : null}
            aria-haspopup="true"
          />
          <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={this.state.open}
            onRequestClose={this.handleRequestClose}
          >
            <MenuItem onClick={this.handleRequestClose}>My account</MenuItem>
            <MenuItem onClick={this.handleRequestClose}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    );
  }
}
