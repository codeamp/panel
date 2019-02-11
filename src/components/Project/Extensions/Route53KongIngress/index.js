import React from 'react';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import InputField from 'components/Form/input-field';
import SelectField from 'components/Form/select-field';
import Loading from 'components/Utils/Loading';
import validatorjs from 'validatorjs';
import { observer, inject } from 'mobx-react';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
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

}`,{
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.store.app.currentEnvironment.id,
    }
  })
})

@inject("store") @observer

export default class Route53Ingress extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      domainOptions: [],
      optionData: {},
      selectedOption: {}
    }

    this.onIngressSelect = this.onIngressSelect.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    let project = props.data.project

    if (props.data.loading) {
      return state
    }

    let domainOptions = []
    let optionData = {}

    project.extensions.forEach(function(extension){
      let controller = _.find(extension.artifacts, function(a) { return a.key === "ingress_controller" });
      if (!controller) {
        return
      }
      let controlledApexDomain = _.find(extension.artifacts, function(a) { return a.key === "controlled_apex_domain"})
      let elbFQDN = _.find(extension.artifacts, function(a) { return a.key === "elb_dns"})
      if(extension.extension.key.includes("ingresskong") && extension.customConfig.type === "loadbalancer") {
        extension.customConfig.upstream_routes.forEach(function(route) {
          route.domains.forEach(function(domain) {
            if (domain.apex === controlledApexDomain.value) {
              let optionKey = `${extension.id}-${domain.subdomain}-${controlledApexDomain.value }`
              domainOptions.push({
                key: optionKey,
                value: `${domain.subdomain}.${domain.apex}(${controller.value})`
              })

              optionData[optionKey] = {
                controller: controller,
                elbFQDN: elbFQDN,
                domain: domain,
                type: extension.customConfig.type
              }
            }
          })
        })
      }
    })

    state.domainOptions = domainOptions
    state.optionData = optionData
    return state
  }

  componentDidMount() {

    const fields = [
      'subdomain',
      'loadbalancer',
      'loadbalancer_fqdn',
      'loadbalancer_type',
    ]
    const rules = {}
    const labels = {
        'subdomain': 'DOMAIN',
        'loadbalancer': 'LOADBALANCER',
        'loadbalancer_fqdn': 'LOADBALANCER FQDN',
        'loadbalancer_type': 'LOADBALANCER TYPE',
    }
    const initials = {}
    const types = {}
    const extra = {}
    const hooks = {
      "loadbalancer": {
        onChange: (field) => {
          this.onIngressSelect(field)
        }
      }
    };

    const plugins = { dvr: validatorjs }
    this.form = new MobxReactForm({ fields, rules, labels, initials, types, extra, hooks }, {plugins })

    this.props.onRef(this)
    if(this.props.init){
      this.form.update(this.props.init)
    }
  }

  componentDidUpdate() {
    this.form.set('extra', {'loadbalancer': this.state.domainOptions})
  }

  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  values(){
    return this.form.values() 
  }

  onError(form){
    // todo
  }

  onSuccess(form){
    var userConfig = {
      "config": [],
      "form": this.form.values(),
    }

    if(this.props.config.fields.size > 0){
      Object.keys(this.props.config.values()).map((key) => {
        userConfig.config.push({ "key": key, "value": this.props.config.values()[key] })
        return null
      })
    }
  }

  renderFQDN(extensionId) {
    if(!extensionId) {
      return null 
    }
    
    return (
      <Grid item xs={12}>
        <InputField fullWidth={true} field={this.form.$('subdomain')} disabled/>
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
              <SelectField fullWidth={true} field={this.form.$('loadbalancer')} />
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

  onIngressSelect(field){
    let selectedOption = this.state.optionData[field.value]
    this.setState({
      selectedOption: selectedOption
    })

    this.form.$('subdomain').set(selectedOption.domain.subdomain)
    this.form.$('loadbalancer_fqdn').set(selectedOption.elbFQDN.value)
    this.form.$('loadbalancer_type').set(selectedOption.type)
  }

  render(){
    const { loading, project } = this.props.data;
    const { type } = this.props;

    if(loading){
      return (
        <Loading />
      );
    }

    if(type === "enabled"){
      return this.renderEnabledView(project)
    } else if(type === "available"){
      return this.renderAvailableView(project)
    } else {
      return (<Typography> ERROR: INVALID VIEW TYPE </Typography>)
    }
  }
}