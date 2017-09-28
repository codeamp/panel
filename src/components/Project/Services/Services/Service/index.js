import React from 'react';

import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Card, { CardContent } from 'material-ui/Card';
import Input from 'material-ui/Input';
import { observer } from 'mobx-react';
import styles from './style.module.css';



@observer
export default class Service extends React.Component {
  render() {

    const { service } = this.props;

    return (
      <Card 
        className={this.props.highlighted === true ? styles.serviceViewHighlighted : styles.serviceView} 
        onClick={() => this.props.editService(service)}>
        <CardContent>
          <Typography type="title">
            {service.name}
          </Typography>
          <Grid container spacing={24}>
            <Grid item xs={1}>
              <Input disabled value={service.count + 'x'} className={styles.serviceCount} />
            </Grid>
            <Grid item xs={11}>
              <Input disabled value={service.command} />
            </Grid>                                
          </Grid>
        </CardContent>
      </Card>
      )
    }
}