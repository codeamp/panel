import React from 'react';

import TextField from 'material-ui/TextField';
import styles from './style.module.css';

import ServicesContent from './content';

export default class Services extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      searchKey: "",
    }
  }   

  handleSearchFieldChange(e){
    this.setState({searchKey: e.target.value})
  }

  render() {
    return (
      <div>
          <div style={{position: "relative"}}>
            <TextField
              fullWidth={true}
              className={styles.searchInput}
              autoFocus={false}
              value={this.state.projectQuery}
              placeholder="Filter..."
              InputProps={{
                disableUnderline: true,
                classes: {
                  root: styles.textFieldRoot,
                  input: styles.textFieldInput,
                },
              }}
              InputLabelProps={{
                shrink: true,
                className: styles.textFieldFormLabel,
              }}
              onChange={(e)=>this.handleSearchFieldChange(e)}              
            />
          </div>
          <ServicesContent {...this.props} searchKey={this.state.searchKey}/>
      </div>
    )
  }
}
