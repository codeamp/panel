import {extendObservable, action} from 'mobx';
import map from 'lodash/map';

class AppStore {
  constructor() {
    const user = JSON.parse(localStorage.getItem('user'));
    var envParams = new URLSearchParams(window.location.search)

    var currentEnv = {id: null, name: null, color: 'gray'}
    var envId = envParams.get('id')
    var envName = envParams.get('name')
    var envColor = envParams.get('color')
    if (envId !== "") {
      currentEnv.id = envId
    }
    if (envName !== "") {
      currentEnv.name = envName
    }
    if (envColor !== "") {
      currentEnv.color = envColor
    }
    var envQueryString = `id=${currentEnv.id}&name=${currentEnv.name}&color=${currentEnv.color}`
    
    var adminLeftNavOpen = JSON.parse(localStorage.getItem('adminLeftNavOpen'));
    var projectTitle = '';    
    if(!projectTitle){
      projectTitle = '';
    }

    if(!adminLeftNavOpen){
      adminLeftNavOpen = false
    }

    extendObservable(this, {
      title: 'CodeAmp Panel',
      user: user,
      leftNavItems: [],
      leftNavProjectTitle: projectTitle,
      bookmarks: [],
      adminLeftNavOpen: adminLeftNavOpen,
      ws: {
        channel: null,
        data: null,
      },
      snackbar: {
        created: null,
        msg: null,
        open: false,
      },
      connectionHeader: {
          msg: "",
      },
      currentEnvironment: currentEnv,
      environmentQueryString: envQueryString,
      features: {
        showDeployed: false,
      },
    });
  }

  setFeatures = action(features => {
    this.features = features;
  })
  
  setTitle = action(title => {
    this.title = title;
  });

  setAdminLeftNav = action(open => {
    this.adminLeftNavOpen = open;
    localStorage.setItem('adminLeftNavOpen', open);    
  });

  setNavProjects = action(projects => {
    this.bookmarks = []
    map(projects, (project)=>{
      this.bookmarks.push({
        key: project.id,
        name: project.name,
        slug: "/projects/"+project.slug,
      })
    });
  });

  setProjectTitle = action(title => {
    this.leftNavProjectTitle = title;
    localStorage.setItem('projectTitle', title);
  })

  setSnackbar = action(params => {
    this.snackbar.created = new Date();
    this.snackbar.msg = params.msg;
    this.snackbar.open = params.open;
  })

  setUser = action(user => {
    let { localStorage } = window
    this.user = user
    localStorage.setItem('user', JSON.stringify(user));
  });

  setConnectionHeader = action(params => {
    this.connectionHeader.msg = params.msg;
  });

  setCurrentEnv = action(params => {
    this.currentEnvironment.id = params.id;
    this.currentEnvironment.name = params.name;
    this.currentEnvironment.color = params.color
    if(params.color){ this.currentEnvironment.color = params.color; }

    this.environmentQueryString = `id=${this.currentEnvironment.id}&name=${this.currentEnvironment.name}&color=${this.currentEnvironment.color}`
  })
}

export default AppStore;
