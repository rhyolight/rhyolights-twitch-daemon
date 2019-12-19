const OBSWebSocket = require('obs-websocket-js')

class ObsClient {

  constructor() {
    this.obs = new OBSWebSocket();
  }

  start() {
    this.obs.connect()
    .then(() => {
      console.log(`Success! We're connected & authenticated.`);
    })
    .catch(err => {
      console.log(err);
    })
  }

  listScenes() {
    this.obs.send('GetSceneList')
    .then(data => {
      console.log(data)
    })
    .catch(err => {
      console.log(err);
    })
  }

  listSources() {
    this.obs.send('GetSourcesList')
    .then(data => {
      console.log(data)
    })
    .catch(err => {
      console.log(err);
    })
  }

  activateSource(name) {
    this.obs.send('SetSceneItemProperties', {item: name, visible: true})
    .catch(err => {
      console.log(err)
    })
  }

  deactivateSource(name) {
    this.obs.send('SetSceneItemProperties', {item: name, visible: false})
    .catch(err => {
      console.log(err)
    })
  }

  switchScene(name) {
    return this.obs.send('SetCurrentScene', {'scene-name': name})
  }

  mindblown() {
    let me = this
    me.activateSource('Mindblown')
    setTimeout(() => {
      me.deactivateSource('Mindblown')
    }, 18500)
  }

  window() {
    this.listScenes()
    this.switchScene('ROOM')
    .then((resp) => {
      this.activateSource('Mobile Cam 1')
      this.deactivateSource('Mobile Cam 2')
      this.deactivateSource('Corner Cam')
    })
  }

}
module.exports = ObsClient
