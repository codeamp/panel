import React from 'react';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Paper from 'material-ui/Paper';
import CloseIcon from 'material-ui-icons/Close';
import IconButton from 'material-ui/IconButton';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import Input from 'material-ui/Input';

import { observer } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';

import styles from './style.module.css';

import InputField from 'components/Form/input-field';
import SelectField from 'components/Form/select-field';

const DEFAULT_EXTENSION = {
    id: -1,
    artifacts: [],
}

const DEFAULT_EXTENSION_SPEC = {
    id: -1,
}

@observer
export default class LoadBalancer extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      dialogOpen: false,
      addButtonDisabled: false,
      buttonText: 'Add',
      extension: DEFAULT_EXTENSION,
      extensionSpec: DEFAULT_EXTENSION_SPEC,
    }
  }

  componentWillMount(){
    this.createFormWithPastData({ loadBalancerPairs: [] }, '')
  }

  componentWillReceiveProps(nextProps){
    console.log(nextProps)
  }

  createFormWithPastData(pastData, serviceId){
    console.log(pastData, serviceId)

    // get old form
    let oldForm = null
    if(this.lbForm != null){
      oldForm = this.lbForm
    }

    const fields = [
      'loadBalancerPairs',
      'loadBalancerPairs[]',
      'loadBalancerPairs[].service',
      'loadBalancerPairs[].subdomain',
      'loadBalancerPairs[].access',
      'loadBalancerPairs[].portMaps',
      'loadBalancerPairs[].portMaps[]',
      'loadBalancerPairs[].portMaps[].port',
      'loadBalancerPairs[].portMaps[].containerPort',
      'loadBalancerPairs[].portMaps[].serviceProtocol',
    ];

    const rules = {};

    const labels = {
      'loadBalancerPairs[].service': 'Service',
      'loadBalancerPairs[].subdomain': 'Subdomain (.example.net)',
      'loadBalancerPairs[].access': 'Access',
      'loadBalancerPairs[].portMaps': 'Port Maps',
      'loadBalancerPairs[].portMaps[].port': 'Port',
      'loadBalancerPairs[].portMaps[].containerPort': 'Container Port',
      'loadBalancerPairs[].portMaps[].serviceProtocol': 'Protocol',
    };

    const initials = {
    };

    const placeholders = {
      'loadBalancerPairs[].subdomain': 'api',
    }

    const types = {
      'loadBalancerPairs[].portMaps[].containerPort': 'numeric',
    };
    const extra = {
      'loadBalancerPairs[].service': this.props.project.services.map(function(service){ return { key: service.id, value: service.name } }),
      'loadBalancerPairs[].access': [{
          key: 'Internal',
          value: 'Internal'
      },{
          key: 'Office',
          value: 'Office',
      }, {
          key: 'External',
          value: 'External',
      }],
      'loadBalancerPairs[].portMaps[].containerPort': [],
      'loadBalancerPairs[].portMaps[].serviceProtocol': [{
          key: 'HTTPS',
          value: 'HTTPS'
      },{
          key: 'HTTP',
          value: 'HTTP',
      }, {
          key: 'SSL',
          value: 'SSL',
      },{
          key: 'TCP',
          value: 'TCP',
      }, {
          key: 'UDP',
          value: 'UDP',
      }]
    }

    var self = this
    const $hooks = {
        onAdd(instance) {
          console.log('-> onAdd HOOK', instance.path || 'form');
        },
        onDel(instance) {
          console.log('-> onDel HOOK', instance.path || 'form');
        },
        onSubmit(instance){
          console.log('-> onSubmit HOOK', instance.path || 'form');
        },
        onSuccess(instance){
          console.log('Form Values!', instance.values())
        },
        sync(instance){
          console.log('sync', instance)
        },
        onChange(instance){
          console.log('instance', instance.value)
          if(instance.labels() === 'Service'){
            console.log(self.lbForm.values())
            let pastData = self.lbForm.values()['loadBalancerPairs']
            self.createFormWithPastData({ loadBalancerPairs:  pastData }, instance.value)
          }
        }
      };    

    const hooks = {
        'loadBalancerPairs': $hooks,
        'loadBalancerPairs[]': $hooks,
        'loadBalancerPairs[].service': $hooks,
        'loadBalancerPairs[].portMaps': $hooks,
        'loadBalancerPairs[].portMaps[]': $hooks,        
    };
    const plugins = { dvr: validatorjs };

    this.lbForm = new MobxReactForm({ fields, rules, labels, initials, types, extra, hooks }, { plugins }) 
    
    this.lbForm.update({ loadBalancerPairs: pastData['loadBalancerPairs'] })
    
    let lbPairOptions = {}

    this.lbForm.$('loadBalancerPairs').map(function(lbPair, idx){
      let ports = []

      if(idx === parseInt(serviceId.split(':')[1])) {
        lbPairOptions[idx] = { containerPort: [] }        
        self.props.project.services.map(function(service){
          console.log(serviceId.split(':')[0])
          if( service.id === serviceId.split(':')[0] ){
            service.containerPorts.map(function(cPort){
              console.log(cPort)
              ports.push({ 
                key: cPort.id,
                value: cPort.port,
              })
            })
          }
        })      
        console.log("CHANGE!", ports, idx)
        lbPairOptions[idx] = { containerPort: ports }        
        self.lbForm.state.extra(lbPairOptions)
      } else {
        if(oldForm != null){
          oldForm.$('loadBalancerPairs').map(function(oldLbPair, oldIdx){                
            if(oldIdx !== parseInt(serviceId.split(':')[1])){
              lbPairOptions[oldIdx] = { containerPort: [] }                  
              console.log('persist old extra', oldIdx)
              console.log(oldLbPair.$('portMaps').state.extra())
              let oldExtra = oldLbPair.$('portMaps').state.extra()
              if(oldExtra != null){
                lbPairOptions[oldIdx] = { containerPort: oldExtra[oldIdx]['containerPort'] }
                self.lbForm.state.extra(lbPairOptions)
              }
            }
          })
        }
      }
    })

    console.log('extra loadBalancerPairs', this.lbForm.$('loadBalancerPairs').state.extra())
  }

  handleDelete(extension){
    console.log('handleDeleteExtension', extension)
  }


  onSuccess(form){
    console.log('onSuccessAddExtension')

    let formSpecValues = form.values()

    const convertedFormSpecValues = Object.keys(formSpecValues).map(function(key, index) {
        return {
            'key': key,
            'value': JSON.stringify(formSpecValues[key])
        }
    })

    console.log(convertedFormSpecValues, this.props.project.id, this.props.extensionSpec.id, this.props.store.app.currentEnvironment.id)

    if(this.props.viewType === 'edit'){
        this.props.createExtension({
          variables: {
            'projectId': this.props.project.id,
            'extensionSpecId': this.props.extensionSpec.id,
            'formSpecValues': convertedFormSpecValues,
            'environmentId': this.props.store.app.currentEnvironment.id,
          }
        }).then(({ data }) => {
          console.log(data)
        }).catch(error => {
          this.setState({ addButtonDisabled: false, buttonText: 'Add' })
          console.log(error)
        })
    } else if(this.props.viewType === 'read'){
        console.log(this.state.extension)
        this.props.updateExtension({
          variables: {
            'id': this.state.extension.id,
            'projectId': this.props.project.id,
            'extensionSpecId': this.props.extensionSpec.id,
            'formSpecValues': convertedFormSpecValues,
            'environmentId': this.props.store.app.currentEnvironment.id,
          }
        }).then(({ data }) => {
          console.log(data)
        }).catch(error => {
          this.setState({ addButtonDisabled: false, buttonText: 'Add' })
          console.log(error)
        })
    }
  }


  onError(form){
    console.log('onErrorAddExtension')
  }

  onAdd(extension, event){
    console.log('handleAddExtension', extension)
    let buttonText = "Adding"
    if(this.props.viewType === "read"){
        buttonText = "Updating"
    }
    this.setState({ addButtonDisabled: true, buttonText: buttonText})

    if(this.lbForm){
      this.lbForm.onSubmit(event, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
    }
  }


  render(){
    const { viewType } = this.props;

    var self = this

    let view = (<div></div>);
    if(viewType === "edit"){
      view = (
        <div>
          <form onSubmit={(e) => e.preventDefault()}>
            <Grid container spacing={24}>

              {this.lbForm.$('loadBalancerPairs').map(function(loadBalancerPair, idx){
                return (
                  <Grid item xs={10}>
                    <Grid item xs={4}>
                      <SelectField autoWidth={true} field={loadBalancerPair.$('service')} parentIdx={idx} />
                    </Grid>
                    <Grid item xs={8}>
                      <InputField fullWidth={true} field={loadBalancerPair.$('subdomain')} />
                    </Grid>
                    <Grid item xs={12}>
                      <SelectField autoWidth={true} field={loadBalancerPair.$('access')} />
                    </Grid>                 
                    {loadBalancerPair.$('service').value !== '' &&             
                      <Grid item xs={12}>
                        <div>
                          <Typography type="subheading"> Port Maps </Typography>
                          <Typography type="body2"> Note: You should not choose a Container Port twice as you will receive an error from the server. </Typography>
                          {loadBalancerPair.$('portMaps').map(function(cPort){
                            console.log(cPort.state.extra('containerPort'))
                            return (
                              <Grid container spacing={24}>
                                  <Grid item xs={2}>
                                      <InputField field={cPort.$('port')} />
                                  </Grid>
                                  <Grid item xs={5}>
                                      <SelectField autoWidth={true} field={cPort.$('containerPort')} extraKey="containerPort" parentIdx={idx} />
                                  </Grid>                                                        
                                  <Grid item xs={4}>
                                      <SelectField field={cPort.$('serviceProtocol')} />
                                  </Grid>                                
                                  <Grid item xs={1}>
                                    <IconButton>
                                      <CloseIcon onClick={cPort.onDel} />
                                    </IconButton>
                                  </Grid>                                
                              </Grid>
                            )
                          })}
                          <br/>
                          <Button raised color="secondary" onClick={loadBalancerPair.$('portMaps').onAdd}>
                              Add port map
                          </Button>
                        </div>  
                      </Grid>                      
                    }    
                  <Grid item xs={1}>
                    <IconButton>
                      <CloseIcon onClick={loadBalancerPair.onDel} />
                    </IconButton>
                  </Grid>                                                    
                </Grid>
                )
              })}
              <br/>
              <Button color="primary" onClick={self.lbForm.$('loadBalancerPairs').onAdd}>
                  Add load balancer
              </Button>
              <br/>
            </Grid>
            <Grid item xs={12}>
              <Button raised color="primary" className={styles.rightPad}
                onClick={this.onAdd.bind(this)}
                disabled={this.state.addButtonDisabled}
              >
                {this.state.buttonText}
              </Button>
              <Button color="primary"
                className={styles.paddingLeft}
                onClick={this.props.handleClose}
              >
                cancel
              </Button>
            </Grid>
          </form>

        <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
          <DialogTitle>{"Ae you sure you want to delete " + this.state.extensionSpec.name + "?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will remove the extension.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleDelete.bind(this)} color="accent">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>


        </div>
      )
    }
    return view
  }

}