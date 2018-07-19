import React from 'react';
import Grid from 'material-ui/Grid';
import Paper from 'material-ui/Paper';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Typography from 'material-ui/Typography';
import Toolbar from 'material-ui/Toolbar';
import Pagination from '../Pagination';

import styles from './style.module.css';

export default class PanelTable extends React.Component { 

  render() {
    const { title, columns, rows, paginator } = this.props;
    var self = this;

    let firstRowIndex = 1
    let lastRowIndex = rows.length

    if(paginator.page !== 1){
      firstRowIndex = ((paginator.page - 1) * paginator.rowsPerPage) + 1
      lastRowIndex = firstRowIndex + rows.length - 1
    }
  
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
                      {columns.map(function(col, colIdx){
                        return (
                          <TableCell
                            key={colIdx}>
                            {col.getVal(row)}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
                <Pagination 
                  firstRowIndex={firstRowIndex}
                  lastRowIndex={lastRowIndex}
                  paginator={paginator}
                  handleNextButtonClick={this.props.handleNextButtonClick}
                  handleBackButtonClick={this.props.handleBackButtonClick}
                />                
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>          
    )        
  }
}
