import React from 'react';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from 'material-ui/Typography';
import InputField from 'components/Form/input-field';
import SelectField from 'components/Form/select-field';
import Loading from 'components/Utils/Loading';
import validatorjs from 'validatorjs';
import { observer, inject } from 'mobx-react';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';


function getIngressControllers(ingressControllerSecret) {
  let primals = ingressControllerSecret.value.split(",")

  let controllers = primals.map((primal) => {
    let parts = primal.split(":")
    return {
      ingress_name: parts[0],
      ingress_id: parts[1],
      ingress_dns: parts[2],
      key: parts[0],
      value: parts[1]

    }
  })
  
  return controllers

}

@graphql(gql`
query Project($slug: String, $environmentID: String, $ingressControllerID: String){
  project(slug: $slug, environmentID: $environmentID) {
    id
    services {
      entries {
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
  }
  ingressController: secret(id: $ingressControllerID) {
    id
    key
    value
  }

}`,{
  options: (props) => {
    let ingressControllerConfigs = props.parentextension.config.filter((item) => {
      if (item.key.toLowerCase() === "ingress_controllers") {
        return item.value
      }
    })

    //TODO: Error handle empty ingress controller config
    //TODO: handle multiple ingress controller configurations
    return {
      variables: {
        slug: props.match.params.slug,
        environmentID: props.store.app.currentEnvironment.id,
        ingressControllerID: ingressControllerConfigs[0].value
      }
  }}
})

@inject("store") @observer

export default class Ingress extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      ingressControllers: []
    }
  }

  componentDidMount() {
    this.initializeForm()
    this.props.onRef(this)
    if(this.props.init){
      this.form.update(this.props.init)
    }
  }

  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  static getDerivedStateFromProps(props, state) {
    let newState = state
    
    let {ingressController} = props.data
    if (ingressController != null) {
      newState.ingressControllers = getIngressControllers(ingressController)
    }

    return newState
  }

  componentDidUpdate(prevProps, prevState) {
    this.initializeForm()
  }

  values(){
    return this.form.values() 
  }

  initializeForm() {
    const fields = [
      'service',
      'type',
      'subdomain',
      'ingress',
      'listener_pairs',
      'listener_pairs[].port',
      'listener_pairs[].containerPort',
      'listener_pairs[].serviceProtocol',
    ]
    const rules = {}
    const labels = {
        'service': 'SERVICE',
        'type': 'ACCESS',
        'subdomain': "SUBDOMAIN",
        'ingress': "INGRESS",
        'listener_pairs': 'LISTENER PAIRS',
        'listener_pairs[].port': 'PORT',
        'listener_pairs[].containerPort': 'CONTAINER PORT',
        'listener_pairs[].serviceProtocol': 'PROTOCOL',
    }
    const initials = {}
    const types = {}
    const extra = {
        'type': [{
            'key': 'internal',
            'value': 'Internal'
        }, {
            'key': 'external',
            'value': 'External'
        }, {
            'key': 'office',
            'value': 'Office'
        }],
        'ingress': this.state.ingressControllers,
        'listener_pairs[].serviceProtocol': [{
            'key': 'http',
            'value': 'HTTP'
        }, {
            'key': 'https',
            'value': 'HTTPS'
        }, {
            'key': 'ssl',
            'value': 'SSL'
        }, {
            'key': 'tcp',
            'value': 'TCP'
        }, {
            'key': 'udp',
            'value': 'UDP'
        }]
    }
    const hooks = {};

    const plugins = { dvr: validatorjs }
    this.form = new MobxReactForm({ fields, rules, labels, initials, types, extra, hooks }, {plugins })
  }

  onError(form){
    // todo
  }

  onSuccess(form){
    // convert obj -> { "config": [kv] }
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
    const { loading, project, ingressController} = this.props.data;
    const { type } = this.props;

    if(loading){
      return (
        <Loading />
      );
    }

    return (
        <div>
            <form onSubmit={(e) => e.preventDefault()}>
                <Grid container spacing={24}>
                    <Grid item xs={12}>
                        <InputField fullWidth={true} field={this.form.$('subdomain')} />
                        <SelectField fullWidth={true} field={this.form.$('ingress')} />
                    </Grid>
                </Grid>
            </form>
        </div>
    )

  }
}
