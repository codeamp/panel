import React from 'react';

import Grid from 'material-ui/Grid';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';

import InputField from 'components/Form/input-field';
import RadioField from 'components/Form/radio-field';

import { observer } from 'mobx-react';
import styles from './style.module.css';



@observer
export default class ContainerPortFormInput extends React.Component {
  render(){
    const { field } = this.props;

    return (
      <div key={this.props.key}>      
        <Grid container spacing={24}>
          <Grid item xs={4}>
            <InputField field={field.$('port')} fullWidth={false} className={styles.containerPortFormInput} />               
          </Grid>
          <Grid item xs={6}>                        
            <RadioField field={field.$('protocol')} />
          </Grid>
          <Grid item xs={1}>
            <IconButton>
              <CloseIcon onClick={field.onDel} />
            </IconButton>
          </Grid>
        </Grid>
      </div>
      )
    }
}