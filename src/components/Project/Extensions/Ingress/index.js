import React from 'react';
import Grid from 'material-ui/Grid';
import InputField from 'components/Form/input-field';
import SelectField from 'components/Form/select-field';
import RadioField from 'components/Form/radio-field';
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
      key: primal,
      value: parts[0]

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
    if (props.parentExtension != null) {
      ingressControllerConfigs = props.parentExtension.config.filter((item) => {
        if (item.key.toLowerCase() === "ingress_controllers") {
          return true
        }
        return false
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
      services: [],
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
    this.form.set('extra', {
      service: this.state.services,
      ingress: this.state.ingressControllers
    })
    
    if (this.form.$('type').value === "loadbalancer") {
      this.form.$('protocol').set("TCP")
    }
  }

  values(){
    return this.form.values() 
  }

  initializeForm() {
    const fields = [
      'service',
      'subdomain',
      'ingress',
      'service',
      'type',
      'protocol'
    ]
    const rules = {}
    const labels = {
        'subdomain': "SUBDOMAIN",
        'ingress': "INGRESS",
        'service': "SERVICE",
        'protocol': "PROTOCOL",
        'type': "TYPE"
    }
    const initials = {}
    const types = {}
    const extra = {
        'ingress': this.state.ingressControllers,
        'service': this.state.services,
        'type': [
          {
            "key": "loadbalancer",
            "value": "Loadbalancer"
          },
          {
            "key": "clusterip",
            "value": "Cluster IP"
          }
        ],
        'protocol': ["TCP", "UDP"]
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
    const { loading } = this.props.data;

    if(loading){
      return (
        <Loading />
      );
    }

    let disabeProtocol = this.form.$('type').value === "loadbalancer" ? true : false

    return (
        <div>
            <form onSubmit={(e) => e.preventDefault()}>
                <Grid container spacing={24} direction={'row'}>
                      <Grid container direction={'row'}>
                        <Grid item xs={12} >
                          <SelectField fullWidth={true} field={this.form.$('type')}/>
                        </Grid>
                        <Grid item xs={8}>
                          <SelectField fullWidth={true} field={this.form.$('service')} key={'services'} />
                        </Grid>
                        <Grid item xs={4}>
                          <RadioField field={this.form.$('protocol')} disabled={disabeProtocol}/>
                        </Grid>
                      </Grid>
                      { this.form.$('type').value === "loadbalancer" &&
                      <Grid container direction={'row'}>
                        <Grid item xs={12}>
                          <InputField fullWidth={true} field={this.form.$('subdomain')} />
                        </Grid>
                        <Grid item xs={12}>
                          <SelectField fullWidth={true} field={this.form.$('ingress')} />
                        </Grid>
                      </Grid>
                      }
                </Grid>
            </form>
        </div>
    )

  }
}
