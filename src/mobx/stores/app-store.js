import {extendObservable, action} from 'mobx';
import map from 'lodash/map';

class AppStore {
  constructor() {
    const user = JSON.parse(localStorage.getItem('user'));
    var currentEnv = JSON.parse(localStorage.getItem('currentEnv'));
    var adminLeftNavOpen = JSON.parse(localStorage.getItem('adminLeftNavOpen'));
    if(!currentEnv){
      currentEnv = {id: null, name: null, color: 'gray'};
    }
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
      url: '',
      connectionHeader: {
          msg: "",
      },
      currentEnvironment: currentEnv,
    });
  }

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

  setUrl = action(url => {
      this.url = url
  })

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
    if(params.color){ this.currentEnvironment.color = params.color; }

    localStorage.setItem('currentEnv', JSON.stringify(params));
  })
}

export default AppStore;
