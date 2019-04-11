const path = require('path')
const fs = require('fs')
const moment = require('moment')

let Twitch = require('./twitch')

const streamWriters = {
    title: (title, dir) => {
        let fd = path.join(dir, 'title.txt')
        fs.writeFileSync(fd, `${title}            `)
    },
    viewer_count: (viewers, dir) => {
        let fd = path.join(dir, 'viewers.txt')
        fs.writeFileSync(fd, `${viewers} viewers`)
    },
    started_at: (startedAt, dir) => {
        let started = moment(startedAt)
        let duration = moment.duration(moment().diff(started)).humanize()
        let fd = path.join(dir, 'duration.txt')
        fs.writeFileSync(fd, `streaming ${duration}`)
    },
}

class LiveStreamer {

    constructor(targetLogin, clientId, clientSecret) {
        this.targetLogin = targetLogin
        this.clientId = clientId
        this.clientSecret = clientSecret
    }

    _prepFileFolder(dir) {
        if (! fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
    }

    _updateFilesFromStream(stream, path) {
        console.log(stream)
        Object.keys(streamWriters).forEach(name => {
            streamWriters[name](stream[name], path)
        })
    }

    startFileStream(path) {
        this._prepFileFolder(path)

        let me = this
        let twitch = new Twitch(this.clientId, this.clientSecret)
        twitch.authenticate((token) => {
            if (! token) throw new Error('Cannot get app token')
            twitch.getUser(me.targetLogin, (user) => {
                function updateStream() {
                    console.log('updating stream...')
                    twitch.getStream(user.login, (stream) => {
                        if (stream) me._updateFilesFromStream(stream, path)
                    })
                }
                updateStream()
                // Every minute, poll for updated stream data
                setInterval(updateStream, 1000*60)
            })
        })
    }
}


module.exports = LiveStreamer
