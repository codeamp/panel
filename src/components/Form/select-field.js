import React from 'react';
import { observer } from 'mobx-react';
import styles from './style.module.css';
import Input from 'material-ui/Input';
import InputLabel from 'material-ui/Input/InputLabel';
import FormControl from 'material-ui/Form/FormControl';
import MenuItem from 'material-ui/Menu/MenuItem';
import FormHelperText from 'material-ui/Form/FormHelperText';
import Select from 'material-ui/Select';
import Tooltip from 'components/Utils/Tooltip';

export default observer(({field, autoWidth, extraKey, fullWidth }) => {
  let extraOptions = field.extra

  if(extraKey){
    if(field.state.extra()){
      extraOptions = field.state.extra()[extraKey]
    } else {
      extraOptions = []
    }
  }

  let renderWithTooltip = (option) => {
    return (
        <MenuItem
          key={option.key}
          value={option.key}>
          <Tooltip title={option.tooltip}>
            <div>{option.value}</div>
          </Tooltip>
        </MenuItem>
    )
  }

  let renderWithoutTooltip = (option) => {
    return (
        <MenuItem
          key={option.key}
          value={option.key}>
          {option.value}
        </MenuItem>
    )
  }

  return (
    <div>
      <FormControl fullWidth={fullWidth} {...field.error ? {error: true} : {}}>
        <InputLabel>{field.label}</InputLabel>
        <Select
          {...field.bind()}
          autoWidth={autoWidth}
          value={field.value}
          className={styles.selectField}
          input={<Input id={field.value} />}
        >
          {extraOptions.map( (option) => {
            if(option.tooltip){
              return renderWithTooltip(option)
            } else {
              return renderWithoutTooltip(option)
            }
          })}
        </Select>
        <FormHelperText> {field.helperText} </FormHelperText>
      </FormControl>
    </div>
    )
});
