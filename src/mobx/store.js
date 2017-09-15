import AppStore from 'mobx/stores/app-store';
import WsStore from 'mobx/stores/ws-store';

const store = {
  app: new AppStore(),
  ws: new WsStore(),
};

export default store;
