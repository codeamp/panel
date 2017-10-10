import React from 'react';

import Grid from 'material-ui/Grid';
import Tabs, { Tab } from 'material-ui/Tabs';
import AppBar from 'material-ui/AppBar';
import { observer } from 'mobx-react';
import styles from './style.module.css';

import Services from './Services';
import EnvironmentVariables from './EnvironmentVariables';


function TabContainer(props) {
  return <div style={{ padding: 20 }}>{props.children}</div>;
}

@observer
export default class ProjectServices extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      value: 0,
    }
  }

  handleChange(event, value) {
    this.setState({ value })
  }

  render() {
    const { value } = this.state;
    const { project, store, serviceSpecs, user } = this.props;

    return (
      <div className={styles.root}>
        <AppBar position="static" className={styles.appBar}>
          <Tabs value={value} onChange={this.handleChange.bind(this)}>
            <Tab label="Services" />
            <Tab label="Environment" />
          </Tabs>
        </AppBar>
               
        <Grid container spacing={24}>                                                            
          <Grid item sm={12}>                    
            {value === 0 && <TabContainer> <Services serviceSpecs={serviceSpecs} project={project} store={store} /> </TabContainer>}
          </Grid>
          <Grid item sm={12}>
            {value === 1 && <TabContainer><EnvironmentVariables project={project} store={store} user={user} /></TabContainer>}
          </Grid>
        </Grid>            
      </div>
      )
    }
}
