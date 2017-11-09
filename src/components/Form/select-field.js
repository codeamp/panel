import React from 'react';
import { observer } from 'mobx-react';
import styles from './style.module.css';

import Input from 'material-ui/Input';
import InputLabel from 'material-ui/Input/InputLabel';
import FormControl from 'material-ui/Form/FormControl';
import MenuItem from 'material-ui/Menu/MenuItem';
import FormHelperText from 'material-ui/Form/FormHelperText';
import Select from 'material-ui/Select';

export default observer(({field, autoWidth, varType }) => {
  let selectView = (
    <div>
        <FormControl>
            <InputLabel>{field.label}</InputLabel>
            <Select
                {...field.bind()}
                autoWidth={autoWidth}
                value={field.value}
                className={styles.selectField}
                input={<Input id={field.key} />}
            >
                {field.extra.map(option => (
                    <MenuItem value={option.key}>
                        {option.value}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText> {field.helperText} </FormHelperText>
        </FormControl>
    </div>
  )

  if(varType === "environmentVariable"){
      console.log(field.value)
      selectView =  (
        <div>
            <FormControl>
                <InputLabel>{field.label}</InputLabel>
                <Select
                    {...field.bind()}
                    autoWidth={autoWidth}
                    value={field.value}
                    className={styles.selectField}
                    input={<Input id={field.key} />}
                >
                    {field.extra.map(function(option){
                        console.log(option)
                        return (
                            <MenuItem value={option.id}>
                                {option.environment.name} : {option.key}={option.value} ({option.type})
                            </MenuItem>
                        )
                    })}
                </Select>
                <FormHelperText> {field.helperText} </FormHelperText>
            </FormControl>
        </div>
      )


  }
  return selectView
});