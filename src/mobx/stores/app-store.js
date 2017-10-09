import {extendObservable, action} from 'mobx';
import map from 'lodash/map';

class AppStore {
  constructor() {
    extendObservable(this, {
      title: 'CodeAmp Panel',
      user: null,
      leftNavItems: [],
      leftNavProjectTitle: '',
      bookmarks: [],
      ws: {
        channel: null,
        data: null,
      },
      snackbar: {
        created: null,
        msg: null,
      },
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

  setProjectTitle = action(title => {
    this.leftNavProjectTitle = title;
  })

  setSnackbar = action(params => {
    console.log(params)
    this.snackbar.created = new Date();
    this.snackbar.msg = params.msg;
  })

  setUser = action(user => {
    let { localStorage } = window
    this.user = user
    localStorage.setItem('user', user);
  });


}

export default AppStore;
