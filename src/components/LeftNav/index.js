import React from 'react';
import { NavLink } from "react-router-dom";
import { withRouter } from 'react-router'
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Drawer from 'material-ui/Drawer';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import PlaylistAddIcon from 'material-ui-icons/PlaylistAdd';
import DashboardIcon from 'material-ui-icons/Dashboard';
import SupervisorAccountIcon from 'material-ui-icons/SupervisorAccount';
import Divider from 'material-ui/Divider';
import Badge from 'material-ui/Badge';

@withRouter
@inject("store") @observer

export default class LeftNav extends React.Component {
  render() {
    return (
      <Drawer docked={true} open={true} className={styles.root}>
        <div className={styles.drawer}>
          <List>
            <NavLink to="/" exact activeClassName={styles.active}>
              <ListItem button>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
            </NavLink>
            <NavLink to="/create" exact activeClassName={styles.active}>
              <ListItem button>
                <ListItemIcon>
                  <PlaylistAddIcon />
                </ListItemIcon>
                <ListItemText primary="Create" />
              </ListItem>
            </NavLink>
            <NavLink to="/admin" exact activeClassName={styles.active}>
              <ListItem button>
                <ListItemIcon>
                  <SupervisorAccountIcon />
                </ListItemIcon>
                <ListItemText primary="Admin" />
              </ListItem>
            </NavLink>
          </List>
          <Divider/>
          <List>
          {this.props.store.app.leftNavItems.map(nav =>
          <NavLink to={nav.slug} key={nav.key} exact activeClassName={styles.active}>
            <ListItem button>
                {nav.icon && !nav.count && <ListItemIcon>
                  {nav.icon}
                </ListItemIcon>}
                {nav.icon && nav.count > 0 &&  <ListItemIcon>
                  <Badge className={styles.badge} badgeContent={4} color="primary">
                    {nav.icon}
                  </Badge>
                </ListItemIcon>}
                <ListItemText primary={nav.name} />
            </ListItem>
          </NavLink>
          )}
          </List>
        </div>
      </Drawer>
    );
  }
}
