import {extendObservable, action} from 'mobx';
import map from 'lodash/map';

class AppStore {
  constructor() {
    const user = JSON.parse(localStorage.getItem('user'));
    var currentEnv = JSON.parse(localStorage.getItem('currentEnv'));
    if(!currentEnv){
      currentEnv = {id: '', color: 'gray'};
    }
    var projectTitle = '';    
    if(!projectTitle){
      projectTitle = '';
    }

    extendObservable(this, {
      title: 'CodeAmp Panel',
      user: user,
      leftNavItems: [],
      leftNavProjectTitle: projectTitle,
      bookmarks: [],
      ws: {
        channel: null,
        data: null,
      },
      snackbar: {
        created: null,
        msg: null,
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
    if(params.color){ this.currentEnvironment.color = params.color; }

    localStorage.setItem('currentEnv', JSON.stringify(params));
  })
}

export default AppStore;
