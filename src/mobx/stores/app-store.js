import {extendObservable, action} from 'mobx';
import map from 'lodash/map';

class AppStore {
  constructor() {
    const user = JSON.parse(localStorage.getItem('user'));
    extendObservable(this, {
      title: 'CodeAmp Panel',
      user: user,
      leftNavItems: [],
      leftNavProjectTitle: '',
      bookmarks: [],
      adminLeftNavOpen: false,
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
      currentEnvironment: {
        id: null, 
        key: null,
        name: null, 
        color: 'gray'
      },
      paginator: {
        limit: 20,
      },
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

  setPaginator = action(paginator => {
    this.paginator = paginator;
  });

  setAdminLeftNav = action(open => {
    this.adminLeftNavOpen = open;
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
  })

  setSnackbar = action(params => {
    this.snackbar.created = new Date();
    this.snackbar.msg = params.msg || this.snackbar.msg;
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
    this.currentEnvironment.key = params.key;
    if(params.color){ this.currentEnvironment.color = params.color; }
  })
}

export default AppStore;
