import React from 'react';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import IconButton from '@material-ui/core/IconButton';

import Typography from 'material-ui/Typography';

export default class Pagination extends React.Component {
    render() {
      const { paginator } = this.props;

      let lastPage = Math.ceil(paginator.count / paginator.limit)
      return(
        <div hidden={paginator.count <= 0} style={{ paddingLeft: 25, textAlign: "left"}}>          
            <Typography style={{userSelect:"none"}}>
              {paginator.page + 1} of {lastPage}
              <IconButton
                onClick={this.props.handleBackButtonClick}
                disabled={paginator.page <= 0}
                aria-label="Previous Page"
              >
                <KeyboardArrowLeft />
              </IconButton>
              <IconButton
                onClick={this.props.handleNextButtonClick}
                disabled={paginator.page >= (lastPage-1)}
                aria-label="Next Page"
              >
                <KeyboardArrowRight />
              </IconButton>            
            </Typography>          
        </div>
      ) 
    }
  }
  