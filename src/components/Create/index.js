import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';

import Input from 'material-ui/Input';
import InputLabel from 'material-ui/Input/InputLabel';
import Card, {CardContent, CardActions} from 'material-ui/Card';
import Button from 'material-ui/Button';
import Radio, {RadioGroup} from 'material-ui/Radio';
import Checkbox from 'material-ui/Checkbox';
import { FormLabel, FormControl, FormControlLabel, FormHelperText, FormGroup } from 'material-ui/Form';

@inject("store") @observer

export default class Create extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      repoType: "",
      url: "",
      msg: "",
      showBadUrlMsg: false,
      urlIsValid: false,
      projectType: "docker",
      bookmarked: true,
    }
  }

  componentWillMount() {
    this.props.store.app.setNavProjects(this.props.projects) 
  }

  handleRepoTypeChange(event){ 

    let urlString = this.state.url
    let msg = ""

    if(event.currentTarget.value == 'public'){
      urlString = "https://" + urlString.replace(':', '/').split("git@")[1]
      msg = "This is a valid HTTPS url."
    }

    if(event.currentTarget.value == 'private'){
      urlString = "git@" + urlString.split('https://')[1].replace('/', ':')
      msg = "This is a valid SSH url."
    }

    this.setState({ repoType: event.currentTarget.value, url: urlString, msg: msg });
  }

  onBookmarkedChange(event){
    this.setState({ bookmarked: !this.state.bookmarked })
  }

  handleUrlChange(event){
    let showBadUrlMsg = false
    let msg = ""
    let repoType = ""
    let urlIsValid = true
    
    let isHTTPS = /^https:\/\/[a-z,0-9,\.]+\/.+\.git$/.test(event.target.value)
    let isSSH = /^git@[a-z,0-9,\.]+:.+.git$/.test(event.target.value)

    if (!isHTTPS && !isSSH) {
      console.log("ERROR")
      msg = '* URL must be a valid HTTPS or SSH url.'
      showBadUrlMsg = true
      urlIsValid = false
      this.setState({ showBadUrlMsg: showBadUrlMsg, msg: msg })     
    }

    if(isHTTPS) {
      msg = "This is a valid HTTPS url."
      repoType = "public"
    }

    if (isSSH) {
      msg = "This is a valid SSH url."
      repoType = "private"
    }

    this.setState({ urlIsValid: urlIsValid, url: event.target.value, showBadUrlMsg: showBadUrlMsg, msg: msg, repoType: repoType })    
  }

  onProjectCreate(event){
    console.log('onProjectCreate')
    return
  }

  render() {

    let urlTextField = (
      <FormControl className={styles.formControl}>
        <InputLabel htmlFor="name-simple">Git Url</InputLabel>
        <Input 
          placeholder="Enter the git url for your project."
          id="name-simple" 
          value={this.state.url} 
          onChange={this.handleUrlChange.bind(this)} />
        <FormHelperText>{this.state.msg}</FormHelperText>
      </FormControl>      
    )    

    if(this.state.showBadUrlMsg){
      urlTextField = (
        <FormControl  className={styles.formControl} error>
          <InputLabel htmlFor="name-error">Git Url</InputLabel>
          <Input id="name-error" value={this.state.name} onChange={this.handleUrlChange.bind(this)} />
          <FormHelperText>{this.state.msg}</FormHelperText>
        </FormControl>        
      )
    }
    return (
      <div className={styles.root}>
        <Card className={styles.card}>          
          <CardContent> 
            <Typography type="subheading" className={styles.title}>
              Create Project
            </Typography>   
             {urlTextField}
            <FormControl 
              className={styles.formControl}
              required>
              <FormLabel>
                Repository Type
              </FormLabel>
              <RadioGroup
                aria-label="repoType"
                name="repoType"
                value={this.state.value}
                onChange={this.handleRepoTypeChange.bind(this)}
              >
                <FormControlLabel disabled={!this.state.urlIsValid} value="public" control={<Radio checked={this.state.repoType === 'public'} />} label="Public" />
                <FormControlLabel disabled={!this.state.urlIsValid} value="private" control={<Radio checked={this.state.repoType === 'private'} />} label="Private" />
              </RadioGroup>

           
            </FormControl>       

            <FormControl 
              className={styles.formControl}
              required>
              <FormLabel>
                Project Type
              </FormLabel>            
            <RadioGroup
                aria-label="projectType"
                name="projectType"
                value={this.state.value}
              >
                <FormControlLabel value="docker" control={<Radio checked={this.state.projectType === 'docker'} />} label="Docker" />
              </RadioGroup>                
            </FormControl>

            <FormGroup row>
              <FormControlLabel
                className={styles.bookmarked}
                control={
                  <Checkbox
                    value="bookmarked"
                    checked={this.state.bookmarked}
                    onChange={this.onBookmarkedChange.bind(this)}
                  />
                }
                label="Add to my bookmarks"
              />
            </FormGroup>            

            
          </CardContent>
          <CardActions>
            <Button 
              onClick={this.onProjectCreate.bind(this)}
              raised color="primary">
              Create
            </Button>                      
          </CardActions>
        </Card>
      </div>
    );
  }
}
