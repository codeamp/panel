import React from 'react';
import Typography from 'material-ui/Typography';

class KubernetesOneShot extends React.Component {
    render() {
        return (
           <div>
               <Typography>
                 ONE SHOT
               </Typography>
            </div>
        )
    }
}

class KubernetesGeneral extends React.Component {
  render() {
      return (
         <div>
             <Typography>
               ONE SHOT
             </Typography>
          </div>
      )
  }
}

function RegisterServiceTypes(){
  return [
   {
      type: "one-shot",
      label: "k8s One Shot",
      component: KubernetesOneShot
    },
    {
      type: "general",
      label: "k8s General",
      component: KubernetesGeneral
    }
  ]
}

export { KubernetesOneShot, KubernetesGeneral, RegisterServiceTypes }