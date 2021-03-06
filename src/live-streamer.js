const path = require('path')
const fs = require('fs')
const moment = require('moment')

const streamWriters = {
    title: (title, dir) => {
        let fd = path.join(dir, 'title.txt')
        let parts = title.split('|')
        fs.writeFileSync(fd, `${parts[0]}`)
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

    constructor(targetLogin, twitchClient) {
        this.targetLogin = targetLogin
        this.twitchClient = twitchClient
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
        let twitch = this.twitchClient
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
                setInterval(updateStream, 1000*360)
            })
        })
    }
}


module.exports = LiveStreamer
