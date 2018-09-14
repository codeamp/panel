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
      key: parts[1],
      value: parts[1]

    }
  })
  
  return controllers

}

function getServicePorts(services) {
  let servicePorts = []
  for (let i = 0; i < services.length; i++) {
    for (let j = 0; j < services[i].ports.length; j++) {
      servicePorts.push({
        key: services[i].name+":"+services[i].ports[j].port,
        value: services[i].name+":"+services[i].ports[j].port
      })
    }
  }

  return servicePorts
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
    let ingressControllerConfigs = []
    let ingressControllerID = ""
    if (props.parentextension != null) {
      ingressControllerConfigs = props.parentextension.config.filter((item) => {
        if (item.key.toLowerCase() === "ingress_controllers") {
          return true
        }
      })

      ingressControllerID = ingressControllerConfigs[0].value
    }


    //TODO: Error handle empty ingress controller config
    //TODO: handle multiple ingress controller configurations
    return {
      variables: {
        slug: props.match.params.slug,
        environmentID: props.store.app.currentEnvironment.id,
        ingressControllerID: ingressControllerID
      }
  }}
})

@inject("store") @observer

export default class Ingress extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      ingressControllers: [],
      services: []
    }
  }

  componentDidMount() {
    this.props.onRef(this)
    // if(this.props.init){
    //   this.initializeForm(this.props.init)
    // } else {
    //   this.initializeForm()
    // }
  }

  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  static getDerivedStateFromProps(props, state) {
    let newState = state
    
    let {ingressController, project} = props.data
    if (ingressController != null) {
      newState.ingressControllers = getIngressControllers(ingressController)
    }

    if (project != null && project.services != null) {
      newState.services = getServicePorts(project.services.entries)
    }

    return newState
  }

  componentDidUpdate(prevProps, prevState) {
    console.log(this.state.services, this.state.ingressControllers, this.form)

    if (this.state.services !== [] &&
        this.state.ingressControllers !== [] &&
        !this.form) {
          
          if (this.props.init) {
            this.initializeForm(this.props.init)
          } else {
            this.initializeForm()
          }

          this.form.state.extra({
            service: this.state.services,
            ingress: this.state.ingressControllers
          })
      
          
    }
  }

  values(){
    return this.form.values() 
  }

  initializeForm(defaultValues = {}) {
    const fields = [
      'service',
      'subdomain',
      'ingress',
      'service'
    ]
    const rules = {}
    const labels = {
        'subdomain': "SUBDOMAIN",
        'ingress': "INGRESS",
        'service': "SERVICE"
    }
    const types = {}
    const extra = {
        'ingress': this.state.ingressControllers,
        'service': this.state.services
    }
    const hooks = {};

    const initials = defaultValues


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
                        <SelectField fullWidth={true} field={this.form.$('service')} key={'services'} />
                    </Grid>
                </Grid>
            </form>
        </div>
    )

  }
}