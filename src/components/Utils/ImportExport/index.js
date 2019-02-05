import React from 'react';

import Button from 'material-ui/Button';
import ImportIcon from '@material-ui/icons/ArrowUpward';
import ExportIcon from '@material-ui/icons/ArrowDownward';

export default class Loading extends React.Component { 

  onImportSecretsClick() {
    this.refs.fileUploader.click()
  } 

  render() {
    return (
      <div>
        <input type="file" id="file" ref="fileUploader" accept=".yml,.yaml" onChange={this.props.onFileImport.bind(this)} style={{display: "none"}}/>                    
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
