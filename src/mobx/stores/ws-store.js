import {extendObservable, action} from 'mobx';

class WsStore {
  constructor() {
    extendObservable(this, {
      socket: null,
      reconnect: null,
      reconnectCount: 0,
      msg: {
        channel: null,
        data: null,
      }
    });
  }

  connect = action(url => {
    this.socket = new WebSocket("ws://localhost:3003/");
    this.socket.onmessage = this.onMessage.bind(this)
    this.socket.onmessage = this.onMessage.bind(this)
    this.socket.onclose = this.onClose.bind(this)
    this.socket.onopen = this.onOpen.bind(this)
    this.socket.onerror = this.onError.bind(this)
  });

  onOpen(ws) {
    clearTimeout(this.reconnect)
    if (this.reconnectCount > 5) {
      this.reconnectCount = 0;
      window.location.reload()
    }
  }

  onClose(ws) {
    console.log('onClose', ws)
  }

  onError(ws) {
    console.log('onError', ws)
  }

  onMessage(ws) {
    let msg = JSON.parse(ws.data);
    this.msg = {
      channel: msg.channel,
      data: msg.data,
    }
  }

}

export default WsStore;
