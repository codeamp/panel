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

@graphql(gql`
query Project($slug: String, $environmentID: String){
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
        'service',
        'type',
        'listener_pairs',
        'listener_pairs[].port',
        'listener_pairs[].containerPort',
        'listener_pairs[].serviceProtocol',
    ]
    const rules = {}
    const labels = {
        'service': 'SERVICE',
        'type': 'ACCESS',
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

    // this.props.createExtension({
    //   variables: {
    //     'projectID': this.props.project.id,
    //     'extensionID': this.props.extension.id,
    //     'config': userConfig,
    //     'environmentID': this.props.store.app.currentEnvironment.id,
    //   }
    // }).then(({ data }) => {
    //   this.setState({ addButtonDisabled: false })
    //   this.form.reset()      
    //   this.props.refetch()
    //   this.props.onCancel()
    // });
  }

  onAdd(extension, event){
    this.setState({ addButtonDisabled: true })
    if(this.form){
      this.form.onSubmit(event, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
    }
  }   
  
  renderLoadBalancerForm(project){
    return (
      <div>
        <form onSubmit={(e) => e.preventDefault()}>
          <Grid container spacing={24}>
            <Grid item xs={12}>
              <SelectField fullWidth={true} field={this.form.$('service')} extraKey={'service'} />
            </Grid>
            <Grid item xs={12}>
              <SelectField fullWidth={true} field={this.form.$('type')} />
            </Grid>        
          </Grid>
          {/* port maps */}
          {this.form.values()['service'] !== "" &&
          <div>
            {this.form.$('listener_pairs').map(function(portMap){
            return (
            <Grid container spacing={24} key={portMap.id}>
              <Grid item xs={3}>
                <InputField fullWidth={true} field={portMap.$('port')} />
              </Grid>
              <Grid item xs={4}>
                <SelectField fullWidth={true} field={portMap.$('containerPort')} extraKey={'containerPort'} />
              </Grid>        
              <Grid item xs={3}>
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
              <Button variant="raised" type="secondary" onClick={this.form.$('listener_pairs').onAdd}>
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
    const extraOptions = project.services.entries.map(function(service){
        return {
          key: service.name,
          value: service.name,
        }
    })

    var containerPortOptions = []
    // get port options depending on selected service, if exists
    if(this.form.$('service').value){
      project.services.entries.map(function(service){
        if(service.name === self.form.$('service').value){
          containerPortOptions = service.ports.map(function(cPort){
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
    if(type === "enabled"){
      return this.renderEnabledView(project)
    } else if(type === "available"){
      return this.renderAvailableView(project)
    } else {
      return (<Typography> ERROR: INVALID VIEW TYPE </Typography>)
    }
  }
}
