import React from 'react';
import Grid from 'material-ui/Grid';
import Paper from 'material-ui/Paper';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Drawer from 'material-ui/Drawer';
import Menu, { MenuItem } from 'material-ui/Menu';
import Typography from 'material-ui/Typography';
import Toolbar from 'material-ui/Toolbar';

import styles from './style.module.css';

export default class PanelTable extends React.Component { 

  render() {
    const { title, columns, rows } = this.props;
    var self = this;
  
    return (
      <Grid container justify="center" alignItems="center">
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <Paper className={styles.tablePaper}>
            <Toolbar>
              <Typography variant="title">
                {title}
              </Typography>
            </Toolbar>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map(col =>
                    (
                      <TableCell>
                        {col.label}
                      </TableCell>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(function(row, idx){
                  return (
                    <TableRow
                      hover
                      tabIndex={-1}
                      onClick={() => self.props.onClick(idx)}
                      key={row.id}
                    >
                      {columns.map(function(col){
                        return (
                          <TableCell>
                            {col.getVal(row)}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>          
    )        
  }
}
