import React from 'react';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import styles from './style.module.css';
import { observer } from 'mobx-react';
import jstz from 'jstimezonedetect';
import moment from 'moment';
import 'moment-timezone';

import MissingSecretIcon from '@material-ui/icons/Report';

@observer
export default class EnvVarVersionHistory extends React.Component {
  render() {
    const { onClickVersion, versions } = this.props

    return (
      <Grid item xs={12}>
        <Paper className={styles.root}>
          <div className={styles.tableWrapper}>
            <Toolbar>
              <div>
                <Typography variant="title">
                  Version History
                </Typography>
              </div>
            </Toolbar>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    Version
                  </TableCell>
                  <TableCell>
                    Creator
                  </TableCell>
                  <TableCell>
                    Created At
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {versions.map(function(secret, idx){
                  return (
                    <TableRow
                      hover
                      tabIndex={-1}
                      onClick={() => onClickVersion(idx)}
                      key={idx}>
                      <TableCell>
                        {versions.length - idx}
                      </TableCell>
                      <TableCell>
                        {secret.user ? secret.user.email : <MissingSecretIcon/> }
                      </TableCell>
                      <TableCell>
                        {moment(new Date(secret.created)).format("ddd, MMM Do, YYYY HH:mm:ss") + " (" + moment.tz(jstz.determine().name()).format('z') + ")"}
                      </TableCell>
                    </TableRow>
                  )
                })}                            
              </TableBody>
            </Table>
          </div>                        
        </Paper>
      </Grid>          
    )        
  }
}
