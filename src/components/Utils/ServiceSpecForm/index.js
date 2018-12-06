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
    this.form = this.initServiceSpecsForm()    
  }

  onError(){
    // todo
  }

  onSubmit(e){
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  componentWillMount() {
    const { serviceSpec } = this.props

    if(!!serviceSpec && !!serviceSpec.id) {
      this.form = this.initServiceSpecsForm({
        name: serviceSpec.name,
        cpuRequest: serviceSpec.cpuRequest,
        cpuLimit: serviceSpec.cpuLimit,
        memoryRequest: serviceSpec.memoryRequest,
        memoryLimit: serviceSpec.memoryLimit,
        terminationGracePeriod: serviceSpec.terminationGracePeriod,
        isDefault: serviceSpec.isDefault,
        id: serviceSpec.id,
      })
    } else {
      this.form = this.initServiceSpecsForm()
    }    
  }  

  onSuccess(form){
    if(this.form.values()['id'] === ''){
      this.props.create(form.values())
    } else {
      this.props.update(form.values())
    }
  }  

  initServiceSpecsForm(formInitials = {}) {
    const fields = [
      'name',
      'cpuRequest',
      'cpuLimit',
      'memoryRequest',
      'memoryLimit',
      'terminationGracePeriod',
      'id',
      'isDefault',
    ];
    const rules = {
      'name': 'required|string',
      'cpuRequest': 'required|numeric',
      'cpuLimit': 'required|numeric',
      'memoryRequest': 'required|numeric',
      'memoryLimit': 'required|numeric',
      'terminationGracePeriod': 'required|string',
    };
    const labels = {
      'name': 'Name',
      'cpuRequest': 'CPU Request (millicpus)',
      'cpuLimit': 'CPU Limit (millicpus)',
      'memoryRequest': 'Memory Request (mb)',
      'memoryLimit': 'Memory Limit (mb)',
      'terminationGracePeriod': 'Timeout (seconds)',
      'isDefault': 'Default profile that will be applied to new services.',
    };
    const initials = formInitials;
    const types = {
      'isDefault': 'checkbox',
    };
    const extra = {};
    const hooks = {};
    const plugins = { dvr: validatorjs };

    return new MobxReactForm({ fields, rules, labels, initials, extra, hooks, types }, { plugins })
  }    

  render() {
    const { serviceSpec } = this.props;

    if(!serviceSpec){
      return (
        <div> No Service Spec found </div>
      )
    }

    return (
      <div>
        <form onSubmit={(e) => e.preventDefault()}>
          <Grid container spacing={24} className={styles.grid}>
            <Grid item xs={12}>
              <InputField field={this.form.$('name')} fullWidth={true} />
            </Grid>
            <Grid item xs={6}>
              <InputField field={this.form.$('cpuRequest')} fullWidth={true} />
            </Grid>
            <Grid item xs={6}>
              <InputField field={this.form.$('cpuLimit')} fullWidth={true} />
            </Grid>
            <Grid item xs={6}>
              <InputField field={this.form.$('memoryRequest')} fullWidth={true} />
            </Grid>
            <Grid item xs={6}>
              <InputField field={this.form.$('memoryLimit')} fullWidth={true} />
            </Grid>
            <Grid item xs={6}>
              <InputField field={this.form.$('terminationGracePeriod')} fullWidth={true} />
            </Grid>
            {!serviceSpec.service &&
              <Grid item xs={12}>
                <CheckboxField field={this.form.$('isDefault')} fullWidth={true} />
              </Grid>
            }
            <Grid item xs={12}>
              <CheckboxField field={this.form.$('isDefault')} fullWidth={true} />
            </Grid>                  
            <Grid item xs={12}>
              <Button color="primary"
                  className={styles.buttonSpacing}
                  disabled={this.state.saving}
                  type="submit"
                  variant="raised"
                  onClick={this.onSubmit.bind(this)}>
                  Save
              </Button>

              {this.form.values()['id'] !== '' &&
                <Button
                  disabled={this.state.saving}
                  style={{ color: "red" }}
                  onClick={() => {this.props.delete(this.form.values())}}>
                  Delete
                </Button>
              }
              <Button
                color="primary"
                onClick={this.props.cancel}>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>          
      </div>
    )
  }
}

