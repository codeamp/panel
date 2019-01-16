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
    const { title, columns, rows, paginator, onEmpty } = this.props;
    var self = this;

    return (
      <Grid container justify="center" alignItems="center">
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <Paper className={styles.tablePaper}>
            <Toolbar>
              <Typography variant="title" style={{userSelect:"none"}}>
                {title}
              </Typography>
            </Toolbar>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((col,idx) =>
                    (
                      <TableCell key={idx} style={{userSelect:"none"}}>
                        {col.label}
                      </TableCell>
                    ))}
                </TableRow>    
              </TableHead>
              <TableBody>
                { rows && rows.map(function(row, idx){
                  return (
                    <TableRow
                      hover
                      tabIndex={-1}
                      onClick={() => self.props.onClick(idx)}
                      key={idx}
                    >
                      {columns.map(function(col, colIdx){
                        return (
                          <TableCell
                            key={colIdx}
                            style={{userSelect:"none"}}>
                            {col.getVal(row)}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {(rows.length === 0 && onEmpty !== null) && onEmpty()}
            <Pagination 
                  paginator={paginator}
                  handleNextButtonClick={this.props.handleNextButtonClick}
                  handleBackButtonClick={this.props.handleBackButtonClick}
                />   
          </Paper>
        </Grid>
      </Grid>          
    )        
  }
}
