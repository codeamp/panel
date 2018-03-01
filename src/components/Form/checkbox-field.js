import React from 'react';
import { observer } from 'mobx-react';
import styles from './style.module.css';
import Checkbox from 'material-ui/Checkbox';
import Grid from 'material-ui/Grid';
import FormHelperText from 'material-ui/Form/FormHelperText';
import { FormControlLabel } from 'material-ui/Form';

export default observer(({field, label}) => {
  return (
    <div className={styles.root}>
      <Grid container spacing={24}>   
        <Grid item xs={6}>    
        <FormControlLabel
            control={
              <Checkbox
                checked={field.value}
                {...field.bind({value: String(field.value)})}
              />
            }
            label={label ? label : field.label}
          />
        </Grid>                
        <FormHelperText>{field.error}</FormHelperText>            
      </Grid>
    </div>
  )
});
