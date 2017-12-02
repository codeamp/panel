import React from 'react';
import { observer } from 'mobx-react';
import styles from './style.module.css';

import Input from 'material-ui/Input';
import InputLabel from 'material-ui/Input/InputLabel';
import FormControl from 'material-ui/Form/FormControl';
import MenuItem from 'material-ui/Menu/MenuItem';
import FormHelperText from 'material-ui/Form/FormHelperText';
import Select from 'material-ui/Select';

export default observer(({field, autoWidth, varType, extraKey, parentIdx }) => {
  let options = field.extra

  let idx= ''
  if(parentIdx != null){
      idx = parentIdx
  }

  console.log(idx, extraKey, idx !== '' && extraKey != null)
  if(idx !== '' && extraKey != null){   
    options = field.state.extra()[idx][extraKey]
    console.log(field.state.extra(), idx, extraKey)
  }  

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
                {options.map(function(option){
                    let optionKey = option.key
                    if(idx !== ""){
                        optionKey = option.key + ':' + idx
                    }
                    return (
                        <MenuItem value={optionKey}>
                            {option.value}
                        </MenuItem>
                    )
                }
            )}
            </Select>
            <FormHelperText> {field.helperText} </FormHelperText>
        </FormControl>
    </div>
  )

  if(varType === "environmentVariable"){
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
                        let optionKey = option.id
                        if(idx !== ""){
                            optionKey = option.id + ':' + idx
                        }                        
                        return (
                            <MenuItem value={optionKey}>
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
