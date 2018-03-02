import React from 'react';
import Grid from 'material-ui/Grid';
import Tabs, { Tab } from 'material-ui/Tabs';
import AppBar from 'material-ui/AppBar';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import ServicesComponent from './Services';
import Secrets from './Secrets';


function TabContainer(props) {
  return <div style={{ padding: 20 }}>{props.children}</div>;
}

@inject("store") @observer
export default class Services extends React.Component {

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
    const { match } = this.props;

    return (
      <div className={styles.root}>
        <AppBar position="static" className={styles.appBar}>
          <Tabs value={value} onChange={this.handleChange.bind(this)}>
            <Tab label="Services" />
            <Tab label="Secrets" />
          </Tabs>
        </AppBar>
        {value === 0 && <TabContainer><ServicesComponent match={match} /></TabContainer>}
        {value === 1 && <TabContainer><Secrets match={match} /></TabContainer>}
      </div>
      )
    }
}
