const OBSWebSocket = require('obs-websocket-js')

class ObsClient {

  constructor(/*name, channel, oath, commands*/chatbot) {
    this.chatbot = chatbot
    this.obs = new OBSWebSocket();
  }

  start() {
    this.obs.connect()
    .then(() => {
      console.log(`Success! We're connected & authenticated.`);
    })
    .catch(err => { // Promise convention dicates you have a catch on every chain.
      console.log(err);
    })
  }

}
module.exports = ObsClient
