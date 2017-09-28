import React from 'react';
import { observer } from 'mobx-react';
import styles from './style.module.css';

import Input from 'material-ui/Input';
import InputLabel from 'material-ui/Input/InputLabel';
import FormControl from 'material-ui/Form/FormControl';
import FormHelperText from 'material-ui/Form/FormHelperText';

export default observer(({field, fullWidth}) => (
  <div className={styles.root}>
    <FormControl fullWidth={fullWidth} {...field.error ? {error: true} : {}}>
      <InputLabel htmlFor={field.id}>{field.label}</InputLabel>
      <Input type={field.type} {...field.bind()}/>
      <FormHelperText>{field.error}</FormHelperText>
    </FormControl>
  </div>
));
