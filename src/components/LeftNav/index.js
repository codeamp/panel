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
import { FormControl } from 'material-ui/Form';
import Input, { InputLabel } from 'material-ui/Input';
import Select from 'material-ui/Select';
import { MenuItem } from 'material-ui/Menu';
import ExpandLess from 'material-ui-icons/ExpandLess';
import ExpandMore from 'material-ui-icons/ExpandMore';
import ServiceSpecIcon from 'material-ui-icons/Description';
import ExtensionIcon from 'material-ui-icons/Extension';
import EnvironmentVariableIcon from 'material-ui-icons/VpnKey';
import EnvironmentIcon from 'material-ui-icons/Public';

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
  const { environments, handleEnvChange } = this.props;

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
            <Collapse in={this.state.open} unmountOnExit>
              <NavLink to="/admin/environments" exact activeClassName={styles.active}>
                <ListItem button>
                  <ListItemIcon>
                    <EnvironmentIcon />
                  </ListItemIcon>
                  <ListItemText inset primary="Environments" />
                </ListItem>
              </NavLink>
              <NavLink to="/admin/envVars" exact activeClassName={styles.active}>
                <ListItem button>
                  <ListItemIcon>
                    <EnvironmentVariableIcon />
                  </ListItemIcon>
                  <ListItemText inset primary="Environment Variables" />
                </ListItem>
              </NavLink>
              <NavLink to="/admin/serviceSpecs" exact activeClassName={styles.active}>
                <ListItem button>
                  <ListItemIcon>
                    <ServiceSpecIcon />
                  </ListItemIcon>
                  <ListItemText inset primary="Service Specs" />
                </ListItem>
              </NavLink>
              <NavLink to="/admin/extensionSpecs" exact activeClassName={styles.active}>
                <ListItem button>
                  <ListItemIcon>
                    <ExtensionIcon />
                  </ListItemIcon>
                  <ListItemText inset primary="Extension Specs" />
                </ListItem>
              </NavLink>
            </Collapse>
          </List>
          <Divider/>
          <List>
          { projectTitleItem }
          <Collapse in={this.state.openProject} unmountOnExit>
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
          {this.props.store.app.leftNavProjectTitle !== '' &&
          <ListItem>
            <FormControl>
              <InputLabel>Current Environment</InputLabel>
              <Select
              classes={{
                select: styles.currentEnv,
                root: styles.currentEnv,
              }}
              style={{ width: 200 }}
              value={this.props.store.app.currentEnvironment.id}
              onChange={handleEnvChange}
              input={<Input fullWidth={true} />}
              >
              {environments.map(function(env){
                return (
                  <MenuItem value={env.id}>{env.name}</MenuItem>
                )
              })}
              </Select>
            </FormControl>
          </ListItem>
          }
          </List>
        </div>
      </Drawer>
    );
  }
}
