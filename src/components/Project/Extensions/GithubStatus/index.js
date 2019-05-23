import React from 'react';
import Typography from 'material-ui/Typography';

export default class GithubStatus extends React.Component {
    render() {
        return (
           <div>
               <Typography>
                The default Github Status timeout is 300 seconds. <br/>
                If your github status process takes over the set timeout, you should increase the timeout. <br/>

                To increase the timeout: <br/>
                1. Add a new environment variable in the secrets section with a new timeout value (i.e. GITHUB_STATUS_TIMEOUT=500) <br/>
                2. If already installed, delete the existing Github Status extension <br/>
                3. Install Github Status, mapping TIMEOUT_SECONDS => "CUSTOM_STATUS_TIMEOUT_ENV_VAR" from the drop down <br/>
               </Typography>
            </div>
        )
    }
}
