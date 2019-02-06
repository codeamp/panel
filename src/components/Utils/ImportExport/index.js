import React from 'react';

import Button from 'material-ui/Button';
import ImportIcon from '@material-ui/icons/ArrowUpward';
import ExportIcon from '@material-ui/icons/ArrowDownward';

export default class Loading extends React.Component { 
  constructor(props){
    super(props)
    this.onImportSecretsClick = this.onImportSecretsClick.bind(this)
  }

  onImportSecretsClick() {
    this.fileUploader.click()
  } 

  onChange(event) {
    event.stopPropagation()
    event.preventDefault()
    var file = event.target.files[0]
    let fileReader = new FileReader()
    fileReader.onloadend = this.props.onFileImport
    fileReader.readAsText(file)    
    this.fileUploader.value = ""
  }

  render() {
    return (
      <div>
        <input type="file" id="file" ref={(child) => this.fileUploader = child} accept=".yml,.yaml" onChange={this.onChange.bind(this)} style={{display: "none"}}/>                    
        <Button variant="raised" type="submit" color="secondary"
            aria-haspopup="true"
            style={{ marginRight: 20 }}
            onClick={this.onImportSecretsClick.bind(this)}>
            <ImportIcon /> import
        </Button>
        <Button variant="raised" type="submit" color="secondary"
            saria-haspopup="true"
            onClick={this.props.onExportBtnClick}>
            <ExportIcon /> export                
        </Button>    
      </div>          
    )        
  }
}
