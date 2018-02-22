import React from 'react';
import { observer } from 'mobx-react';
import styles from './style.module.css';
import RadioGroup from 'material-ui/Radio';
import Grid from 'material-ui/Grid';
import FormHelperText from 'material-ui/Form/FormHelperText';
import { FormLabel } from 'material-ui/Form';

export default observer(({field}) => {
  return (
    <div className={styles.root}>
      <Grid container spacing={24}>   
        {field.extra.map(option => (
          <Grid item xs={6} key={option}>    
            <RadioGroup
              name={option}
              value={option}
              onChange={(e, value) => field.onChange(e)}
              checked={option === field.value}
            />
            <FormLabel>{option}</FormLabel>
          </Grid>                
        ))}
        <FormHelperText>{field.error}</FormHelperText>            
      </Grid>
    </div>
  )
});
