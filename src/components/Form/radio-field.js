import React from 'react';
import { observer } from 'mobx-react';
import styles from './style.module.css';

import Radio from 'material-ui/Radio';
import Grid from 'material-ui/Grid';
import FormHelperText from 'material-ui/Form/FormHelperText';
import { FormLabel } from 'material-ui/Form';

export default observer(({field}) => (
  <div className={styles.root}>
    <Grid container spacing={12}>   
      {field.extra.map(option => (
      <Grid item xs={6}>    
        <Radio
          {...field.bind()}
          name={option}
          value={option}
          checked={option === field.value}
        />
        <FormLabel>{option}</FormLabel>
      </Grid>                
      ))}
      <FormHelperText>{field.error}</FormHelperText>            
    </Grid>
  </div>
));
