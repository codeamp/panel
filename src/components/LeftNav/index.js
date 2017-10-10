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
import Collapse from 'material-ui/transitions/Collapse';

import ExpandLess from 'material-ui-icons/ExpandLess';
import ExpandMore from 'material-ui-icons/ExpandMore';
import ServiceSpecIcon from 'material-ui-icons/Description';

@withRouter
@inject("store") @observer


export default class LeftNav extends React.Component {
  state = {
    open: false,
    openProject: true,
  }

  handleClick = () => {
    this.setState({ open: !this.state.open });
  };
  
  render() {

    let projectTitleItem = ""
    if(this.props.store.app.leftNavProjectTitle !== ''){
      projectTitleItem = (
        <ListItem button onClick={() => this.setState({ openProject: !this.state.openProject })}>
          <ListItemText primary={this.props.store.app.leftNavProjectTitle} />
          {this.state.openProject ? <ExpandLess /> : <ExpandMore />}                
        </ListItem>              
      )      
    }


    return (
      <Drawer type="persistent" open={true} className={styles.root}>
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

            <ListItem button onClick={this.handleClick.bind(this)}>
              <ListItemIcon>
                <SupervisorAccountIcon />
              </ListItemIcon>
              <ListItemText primary="Admin" />
              {this.state.open ? <ExpandLess /> : <ExpandMore />}                
            </ListItem>
            <Collapse in={this.state.open} transitionDuration="auto" unmountOnExit>            
              <NavLink to="/admin/serviceSpecs" exact activeClassName={styles.active}>
                <ListItem button>
                  <ListItemIcon>
                    <ServiceSpecIcon />
                  </ListItemIcon>                  
                  <ListItemText inset primary="Service Specs" />
                </ListItem>
              </NavLink>
            </Collapse>            
          </List>
          <Divider/>
          <List>
          { projectTitleItem }
          <Collapse in={this.state.openProject} transitionDuration="auto" unmountOnExit>            
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
          </Collapse>                
          </List>          
        </div>
      </Drawer>
    );
  }
}
