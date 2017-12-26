import React from 'react';
import { observer } from 'mobx-react';
import styles from './style.module.css';

import FormControl from 'material-ui/Form/FormControl';
import FormHelperText from 'material-ui/Form/FormHelperText';
import Typography from 'material-ui/Typography';

export default observer(({field, fullWidth}) => (
  <div className={styles.root}>
    <FormControl fullWidth={fullWidth} {...field.error ? {error: true} : {}}>
      <Typography type="subheading" htmlFor={field.id}>{field.label}</Typography>
      <textarea type={field.type} {...field.bind()} style={{ height: 300}}>
        {field.value}
      </textarea>
      <FormHelperText>{field.error}</FormHelperText>
    </FormControl>
  </div>
));
