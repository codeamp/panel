import React from 'react';
import Grid from 'material-ui/Grid';
import CheckboxField from 'components/Form/checkbox-field';
import Button from 'material-ui/Button';
import InputField from 'components/Form/input-field';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';


@inject("store") @observer
export default class ServiceSpecForm extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      saving: false,
    }
  }

  onError(){
    // todo
  }

  onSubmit(e){
    this.props.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  componentWillMount() {
    // validate service spec form that it has attributes name, cpuRequest, cpuLimit, memoryRequest, memoryLimit, terminationGracePeriod, isDefault    
    if(!!this.props.form){
      Object.keys(this.props.form.values()).forEach(function(val){
        console.log(val)
      })
    }
  }  

  onSuccess(form){
    if(this.props.form.values()['id'] === ''){
      this.props.create(form.values())
    } else {
      this.props.update(form.values())
    }
  }  

  render() {
    const { form, serviceSpec } = this.props;

    if(!form && !serviceSpec){
      return (
        <div className={styles.grid}> No Service Spec found </div>
      )
    }

    return (
      <div>
        <form onSubmit={(e) => e.preventDefault()}>
          <Grid container spacing={24} className={styles.grid}>
            <Grid item xs={12}>
              <InputField field={this.props.form.$('name')} fullWidth={true} />
            </Grid>
            <Grid item xs={6}>
              <InputField field={this.props.form.$('cpuRequest')} fullWidth={true} />
            </Grid>
            <Grid item xs={6}>
              <InputField field={this.props.form.$('cpuLimit')} fullWidth={true} />
            </Grid>
            <Grid item xs={6}>
              <InputField field={this.props.form.$('memoryRequest')} fullWidth={true} />
            </Grid>
            <Grid item xs={6}>
              <InputField field={this.props.form.$('memoryLimit')} fullWidth={true} />
            </Grid>
            <Grid item xs={6}>
              <InputField field={this.props.form.$('terminationGracePeriod')} fullWidth={true} />
            </Grid>
            {!serviceSpec.service &&
              <Grid item xs={12}>
                <CheckboxField field={this.props.form.$('isDefault')} fullWidth={true} />
              </Grid>
            }
            <Grid item xs={12}>
            {(!!this.props.create || !!this.props.update) &&
              <Button color="primary"
                  className={styles.buttonSpacing}
                  disabled={this.state.saving}
                  type="submit"
                  variant="raised"
                  onClick={this.onSubmit.bind(this)}>
                  Save
              </Button>
            }
            {!!this.props.delete && !!serviceSpec &&
              <Button
                disabled={this.state.saving}
                style={{ color: "red" }}
                onClick={() => {this.props.delete(this.props.form.values())}}>
                Delete
              </Button>
            }
            {!this.props.disableCancel &&
              <Button
                color="primary"
                onClick={this.props.cancel}>
                Cancel
              </Button>
            }
            </Grid>
          </Grid>
        </form>          
      </div>
    )
  }
}

