import React from 'react';
import Grid from 'material-ui/Grid';
import InputField from 'components/Form/input-field';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import CloseIcon from '@material-ui/icons/Close';
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
      key: primal,
      value: parts[0]

    }
  })
  
  return controllers

}

function getUpstreamApexDomains(upstreamApexDomainsSecret) {
  let apexes = upstreamApexDomainsSecret.value.split(",")
  let apexOptions = apexes.map((apex) => {
    return {
      key: apex,
      value: apex
    }
  })

  return apexOptions
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
query Project($slug: String, $environmentID: String,
              $ingressControllerID: String,
              $upstreamApexDomainsID: String,
              $controlledApexDomainID: String){
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

  upstreamApexDomains: secret(id: $upstreamApexDomainsID) {
    id
    key
    value
  }

  controlledApexDomain: secret(id: $controlledApexDomainID) {
    id
    key
    value
  }

}`,{
  options: (props) => {
    let ingressControllerConfigs = []
    let ingressControllerID = ""
    let upstreamApexDomainsConfig = []
    let upstreamApexDomainsID = ""
    let controlledApexDomainConfig = []
    let controlledApexDomainID = ""
    if (props.parentExtension != null) {
      ingressControllerConfigs = props.parentExtension.config.filter((item) => {
        if (item.key.toLowerCase() === "ingress_controllers") {
          return true
        }
        return false
      })
      ingressControllerID = ingressControllerConfigs[0].value

      upstreamApexDomainsConfig = props.parentExtension.config.filter((item)=> {
        if (item.key.toLowerCase() === "upstream_apex_domains") {
          return true
        }
        return false
      })

      upstreamApexDomainsID = upstreamApexDomainsConfig[0].value

      controlledApexDomainConfig = props.parentExtension.config.filter((item) => {
        if (item.key.toLowerCase() === "controlled_apex_domain") {
          return true
        }
        return false
      })

      controlledApexDomainID = controlledApexDomainConfig[0].value
    }


    //TODO: Error handle empty ingress controller config
    //TODO: handle multiple ingress controller configurations
    return {
      variables: {
        slug: props.match.params.slug,
        environmentID: props.store.app.currentEnvironment.id,
        ingressControllerID: ingressControllerID,
        upstreamApexDomainsID: upstreamApexDomainsID,
        controlledApexDomainID: controlledApexDomainID
      }
  }}
})

@inject("store") @observer

export default class Ingress extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      ingressControllers: [],
      upstreamApexDomains: [],
      services: [],
      controlledApexDomain: ""
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
    
    let {ingressController, upstreamApexDomains, controlledApexDomain, project} = props.data
    if (ingressController != null) {
      newState.ingressControllers = getIngressControllers(ingressController)
    }

    if (upstreamApexDomains != null) {
      newState.upstreamApexDomains = getUpstreamApexDomains(upstreamApexDomains)
    }

    if (project != null && project.services != null) {
      newState.services = getServicePorts(project.services.entries)
    }

    if (controlledApexDomain != null) {
      newState.controlledApexDomain = controlledApexDomain.value
    }

    return newState
  }

  componentDidUpdate(prevProps, prevState) {
    this.form.set('extra', {
      service: this.state.services,
      ingress: this.state.ingressControllers,
    })

    // set options for each upstream domain
    this.form.$('upstream_domains').map((field) => {
      field.set('extra', {
        apex: this.state.upstreamApexDomains
      })
      return "updated"
    })
    
    if (this.form.$('type').value === "loadbalancer") {
      this.form.$('protocol').set("TCP")

      let formValues = this.form.values()
      if(formValues.upstream_domains.length === 0) {
        this.form.update({
          upstream_domains: [{
              subdomain: "",
              apex: this.state.controlledApexDomain
            }]
        })
      }
    }
  }

  values(){
    return this.form.values() 
  }

  initializeForm() {
    const fields = [
      'service',
      'ingress',
      'service',
      'type',
      'protocol',
      'subdomain',
      'upstream_domains',
      'upstream_domains[].subdomain',
      'upstream_domains[].apex'
    ]
    const rules = {
      'upstream_domains[].subdomain': 'string|required',
      'upstream_domains[].apex': 'string|required'
    }
    const labels = {
        'ingress': "INGRESS",
        'service': "SERVICE",
        'protocol': "PROTOCOL",
        'type': "TYPE",
        'upstream_domains': 'UPSTREAM DOMAINS',
        'upstream_domains[].subdomain': "UPSTREAM SUBDOMAIN",
        'upstream_domains[].apex': "APEX"
    }
    const initials = {}
    const types = {}
    const extra = {
        'ingress': this.state.ingressControllers,
        'service': this.state.services,
        'upstream_domains[].apex': this.state.upstreamApexDomains,
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
                          <SelectField fullWidth={true} field={this.form.$('ingress')} />
                        </Grid>
                        <Grid item xs={12}>
                          {this.form.$('upstream_domains').map(function(domain){
                          return (
                          <Grid container spacing={24} direction={'row'} key={domain.id}>
                            <Grid item xs={6}>
                              <InputField fullWidth={true} field={domain.$('subdomain')} />
                            </Grid>
                            <Grid item xs={4}>
                              <SelectField fullWidth={true} field={domain.$('apex')} />
                            </Grid>
                            <Grid item xs={2}>
                              <IconButton>
                                <CloseIcon onClick={domain.onDel} />
                              </IconButton>
                            </Grid>                                                                                          
                          </Grid>                            
                          )
                          })}
                          <Grid item xs={12}>
                            <Button variant="raised" type="secondary" onClick={this.form.$('upstream_domains').onAdd}>
                              Add Upstream Domain
                            </Button>
                          </Grid>        
                          <br/>  
                        </Grid>
                      </Grid>
                      }
                </Grid>
            </form>
        </div>
    )

  }
}
