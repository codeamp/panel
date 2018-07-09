import React from 'react';
import Grid from 'material-ui/Grid';
import Paper from 'material-ui/Paper';
import Table, { TableCell, TableHead, TableBody, TableRow, TableFooter } from 'material-ui/Table';
import Drawer from 'material-ui/Drawer';
import Menu, { MenuItem } from 'material-ui/Menu';
import Typography from 'material-ui/Typography';
import Toolbar from 'material-ui/Toolbar';
import TablePagination from '@material-ui/core/TablePagination';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import IconButton from '@material-ui/core/IconButton';

import styles from './style.module.css';

export default class PanelTable extends React.Component { 

  render() {
    const { title, columns, rows, paginator } = this.props;
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
              </TableBody>
              <TableFooter>
                <TableRow>
                  <div>
                    {paginator.page * paginator.rowsPerPage} - {rows.length} of {paginator.count}
                    <IconButton
                      onClick={this.handleBackButtonClick}
                      disabled={paginator.page === 0}
                      aria-label="Previous Page"
                    >
                      <KeyboardArrowLeft />
                    </IconButton>
                    <IconButton
                      onClick={this.handleNextButtonClick}
                      disabled={paginator.page >= Math.ceil(paginator.count / paginator.rowsPerPage) - 1}
                      aria-label="Next Page"
                    >
                      <KeyboardArrowRight />
                    </IconButton>
                  </div>
                </TableRow>
              </TableFooter>
            </Table>
          </Paper>
        </Grid>
      </Grid>          
    )        
  }
}
