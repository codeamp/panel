import {extendObservable, action} from 'mobx';
import map from 'lodash/map';


const onClose = (ws) => _evt => {
  //Tell the store we've disconnected
  console.log('onClose', ws)
}

class AppStore {
  constructor() {
    extendObservable(this, {
      title: 'CodeAmp Panel',
      user: null,
      leftNavItems: [],
      socket: null,
      ws: {
        channel: null,
        data: null,
      }
    });
  }

  setTitle = action(title => {
    this.title = title;
  });

  setNavProjects = action(projects => {
    this.leftNavItems = []
    map(projects, (project)=>{
      this.leftNavItems.push({
        key: project.id,
        name: project.name,
        slug: "/projects/"+project.slug,
      })
    });
  });

  setUser = action(user => {
    let { localStorage } = window
    this.user = user
    localStorage.setItem('user', user);
  });


}

export default AppStore;
