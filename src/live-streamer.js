const fs = require('fs')
let Twitch = require('./twitch')

class LiveStreamer {

    constructor(targetLogin, clientId, clientSecret) {
        this.targetLogin = targetLogin
        this.clientId = clientId
        this.clientSecret = clientSecret
    }

    _prepFileFolder(path) {
        // mkdir if doesn't exist
        try {
            fs.mkdirSync(path)
        } catch (e) {}
    }

    _updateFilesFromStream(stream) {
        console.log(stream)
    }

    startFileStream(path) {
        this._prepFileFolder(path)

        let me = this
        let twitch = new Twitch(this.clientId, this.clientSecret)
        twitch.authenticate((token) => {
            if (! token) throw new Error('Cannot get app token')
            twitch.getUser(me.targetLogin, (user) => {
                // Every minute, poll for updated stream data
                setTimeout(() => {
                    twitch.getStream(user.login, (stream) => {
                        me._updateFilesFromStream(stream)
                    })
                }, 1000*60)
            })
        })
    }
}


module.exports = LiveStreamer
