import React from 'react';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';
import Typography from 'material-ui/Typography';

import validatorjs from 'validatorjs';
import { observer, inject } from 'mobx-react';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';


export default class GithubStatus extends React.Component {
    constructor(props){
        super(props)
    }

    componentDidMount(){
        console.log('hello there', this.props)
    }

    handleAuth(){
     console.log('handleAuth')
    // make k
    
    }

    render() {
        return (
           <div>
               <Typography>
                1. Create a Personal Access Token <a href="https://github.com/settings/tokens/new"> here </a> <br/>
                2. Enable SSO by clicking on the SSO button located at the top right of the generated PAT entry (located <a href="https://github.com/settings/tokens"> here </a>). <br/>
                3. Copy and save the generated token string as a project Environment Variable. Also create a project Environment Variable for your Github user. <br/>
                4. Select the created environment variables in the Config dropdown above for the respective inputs. <br/>
                5. Click SAVE below and we'll verify that you followed the previous 2 steps.
               </Typography>
            </div>
        )
    }
}
