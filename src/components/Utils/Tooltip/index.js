import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from 'material-ui/Tooltip';

const styles = theme => ({
  fab: {
    margin: theme.spacing.unit * 2,
  },
  absolute: {
    position: 'absolute',
    bottom: theme.spacing.unit * 2,
    right: theme.spacing.unit * 3,
  },
});

function SimpleTooltips(props) {
  const { title, icon } = props;
  return (    
      <div>
        <Tooltip title={title}>
            {icon}
        </Tooltip>
      </div>   
  );
}

SimpleTooltips.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.object.isRequired,
};

export default withStyles(styles)(SimpleTooltips);
