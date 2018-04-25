import React from 'react';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';
import Typography from 'material-ui/Typography';
import InputField from 'components/Form/input-field';
import SelectField from 'components/Form/select-field';
import Loading from 'components/Utils/Loading';
import validatorjs from 'validatorjs';
import { observer, inject } from 'mobx-react';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import Input, { InputLabel } from 'material-ui/Input';
import { FormControl, FormHelperText } from 'material-ui/Form';
import _ from 'lodash'

@graphql(gql`
query Project($slug: String, $environmentID: String){
  project(slug: $slug, environmentID: $environmentID) {
    id
    extensions {
      id
      extension {
        id
        name
        component
        config
        type
        key
        created
      }
      state
      stateMessage
      config
      customConfig
      artifacts
      created
    }
    services {
      id
      name
      command
      serviceSpec {
        id
        name
      }
      count
      type
      ports
      created
    }
  }

}`,{
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.store.app.currentEnvironment.id,
    }
  })
})

@inject("store") @observer

export default class LoadBalancer extends React.Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.onRef(this)
    if(this.props.init){
      this.form.update(this.props.init)
    }
  }

  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  values(){
    return this.form.values() 
  }

  componentWillMount(){
    const fields = [
        'subdomain',
        'loadbalancer',
        'loadbalancer_fqdn',
        'loadbalancer_type',
    ]
    const rules = {}
    const labels = {
        'subdomain': 'SUBDOMAIN',
        'loadbalancer': 'LOADBALANCER',
        'loadbalancer_fqdn': 'LOADBALANCER FQDN',
        'loadbalancer_type': 'LOADBALANCER TYPE',
    }
    const initials = {}
    const types = {}
    const extra = {}
    const hooks = {};

    const plugins = { dvr: validatorjs }
    this.form = new MobxReactForm({ fields, rules, labels, initials, types, extra, hooks }, {plugins })
  }

  onError(form){
    // todo
  }

  onSuccess(form){
    var self = this
    var userConfig = {
      "config": [],
      "form": this.form.values(),
    }

    if(this.props.config.fields.size > 0){
      Object.keys(this.props.config.values()).map(function(key){
        userConfig.config.push({ "key": key, "value": self.props.config.values()[key] })
        return null
      })
    }
  }

  onAdd(extension, event){
    this.setState({ addButtonDisabled: true })
    if(this.form){
      this.form.onSubmit(event, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
    }
  }   

  renderFQDN(extensionId) {
    if(!extensionId) {
      return null 
    }

    const { project } = this.props.data;

    project.extensions.map((extension) => {
      if(extension.id === extensionId) {
        let artifact = _.find(extension.artifacts, function(a) { return a.key === extension.extension.key.toUpperCase() + "_DNS" });

        this.form.$('loadbalancer_fqdn').set(artifact.value);
        this.form.$('loadbalancer_type').set(extension.customConfig.type);
      }
      return null
    })
    
    return (
      <Grid item xs={12}>
        <InputField fullWidth={true} field={this.form.$('loadbalancer_fqdn')} disabled/>
        <InputField fullWidth={true} field={this.form.$('loadbalancer_type')} disabled/>
      </Grid>
    )
  }
  
  renderLoadBalancerForm(project){
    return (
      <div>
        <form onSubmit={(e) => e.preventDefault()}>
          <Grid container spacing={24}>
            <Grid item xs={12}>
              <InputField fullWidth={true} field={this.form.$('subdomain')} />
            </Grid>
            <Grid item xs={12}>
              <SelectField fullWidth={true} field={this.form.$('loadbalancer')} extraKey={'extensions'} />
            </Grid>
            { this.renderFQDN(this.form.values()['loadbalancer']) }
          </Grid>
        </form>
      </div>        
    )
  }

  renderEnabledView(project){
    return (
      <div>
        {this.renderLoadBalancerForm(project)}
      </div>
    )
  }

  renderAvailableView(project){
    return this.renderLoadBalancerForm(project)
  }

  render(){
    const { loading, project } = this.props.data;
    const { type } = this.props;

    if(loading){
      return (
        <Loading />
      );
    }
    
    var self = this
    var extraOptions = []
    project.extensions.map(function(extension){
      if(extension.extension.key.includes("loadbalancer") && extension.customConfig.type !== "internal") {
        extraOptions.push({
          key: extension.id,
          value: extension.extension.name,
        })
      }
      return null
    })

    this.form.state.extra({
        extensions: extraOptions,
    })

    if(type === "enabled"){
      return this.renderEnabledView(project)
    } else if(type === "available"){
      return this.renderAvailableView(project)
    } else {
      return (<Typography> ERROR: INVALID VIEW TYPE </Typography>)
    }
  }
}
