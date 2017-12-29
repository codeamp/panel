import React from 'react';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';
import InputField from 'components/Form/input-field';
import SelectField from 'components/Form/select-field';
import validatorjs from 'validatorjs';
import { observer, inject } from 'mobx-react';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

@inject("store") @observer

@graphql(gql`
query Project($slug: String, $environmentId: String){
  project(slug: $slug, environmentId: $environmentId) {
    id
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
      containerPorts {
        port
        protocol
      }
      created
    }
  }

}`,{
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentId: props.store.app.currentEnvironment.id,
    }
  })
})

export default class LoadBalancer extends React.Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.onRef(this)
    this.form.update(this.props.init)
  }

  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  values(){
    return this.form.values() 
  }

  componentWillMount(){
    const fields = [
        'service',
        'subdomain',
        'access',
        'portMaps',
        'portMaps[].port',
        'portMaps[].containerPort',
        'portMaps[].serviceProtocol',
    ]
    const rules = {}
    const labels = {
        'service': 'SERVICE',
        'subdomain': 'SUBDOMAIN',
        'access': 'ACCESS',
        'portMaps': 'PORT MAPS',
        'portMaps[].port': 'PORT',
        'portMaps[].containerPort': 'CONTAINER PORT',
        'portMaps[].serviceProtocol': 'PROTOCOL',
    }
    const initials = {}
    const types = {}
    const extra = {
        'access': [{
            'key': 'internal',
            'value': 'Internal'
        }, {
            'key': 'external',
            'value': 'External'
        }, {
            'key': 'office',
            'value': 'Office'
        }],
        'portMaps[].serviceProtocol': [{
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

    if(this.props.viewType === 'edit'){
        this.props.createExtension({
          variables: {
            'projectId': this.props.project.id,
            'extensionSpecId': this.props.extensionSpec.id,
            'config': userConfig,
            'environmentId': this.props.store.app.currentEnvironment.id,
          }
        }).then(({ data }) => {
          this.setState({ addButtonDisabled: false })
          this.props.refetch()
          this.props.onCancel()
        });
    }
  }

  onAdd(extension, event){
    this.setState({ addButtonDisabled: true })
    if(this.form){
      this.form.onSubmit(event, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
    }
  }    

  render(){
    const { loading, project } = this.props.data;

    if(loading){
      return (<div>Loading...</div>)
    }
    
    var self = this
    const extraOptions = project.services.map(function(service){
        return {
          key: service.id,
          value: service.name,
        }
    })

    var containerPortOptions = []
    // get port options depending on selected service, if exists
    if(this.form.$('service').value){
      project.services.map(function(service){
        if(service.id === self.form.$('service').value){
          containerPortOptions = service.containerPorts.map(function(cPort){
            return {
              key: cPort.port,
              value: cPort.port
            }
          })
        }
        return null
      })
    }

    this.form.state.extra({
        service: extraOptions,
        containerPort: containerPortOptions,
    })

    return (
      <div>
        <form onSubmit={(e) => e.preventDefault()}>
          <Grid container spacing={24}>
            <Grid item xs={6}>
              <SelectField fullWidth={true} field={this.form.$('service')} extraKey={'service'} />
            </Grid>
            <Grid item xs={6}>
              <InputField fullWidth={true} field={this.form.$('subdomain')} />
            </Grid>        
            <Grid item xs={12}>
              <SelectField fullWidth={true} field={this.form.$('access')} />
            </Grid>        
          </Grid>
          {/* port maps */}
          {this.form.values()['service'] !== "" &&
          <div>
            {this.form.$('portMaps').map(function(portMap){
            return (
            <Grid container spacing={24}>
              <Grid item xs={2}>
                <InputField fullWidth={true} field={portMap.$('port')} />
              </Grid>
              <Grid item xs={4}>
                <SelectField fullWidth={true} field={portMap.$('containerPort')} extraKey={'containerPort'} />
              </Grid>        
              <Grid item xs={4}>
                <SelectField fullWidth={true} field={portMap.$('serviceProtocol')} />
              </Grid>      
              <Grid item xs={2}>
                <IconButton>
                  <CloseIcon onClick={portMap.onDel} />
                </IconButton>
              </Grid>                                                                                          
            </Grid>                            
            )
            })}
            <Grid item xs={12}>
              <Button raised type="secondary" onClick={this.form.$('portMaps').onAdd}>
                Add Port Map
              </Button>
            </Grid>        
            <br/>  
          </div>      
          }
        </form>
      </div>
    )
  }
}
