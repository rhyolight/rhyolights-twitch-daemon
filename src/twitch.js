let request = require('request')

let authUrl = 'https://id.twitch.tv/oauth2/token'
let userUrl = 'https://api.twitch.tv/helix/users'
let streamUrl = 'https://api.twitch.tv/helix/streams'

class Twitch {

    constructor(clientId, clientSecret) {
        this.clientId = clientId
        this.clientSecret = clientSecret
    }


    // Following the Twitch API authentication flow by getting an app access
    // token.
    authenticate(cb) {
        let opts = {
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.clientSecret}`,
            },
            json: {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'client_credentials',
                scope:'',
            }
        };
        request.post(authUrl, opts, (error, resp, body) => {
            console.log('auth returned... storing access token')
            cb(body.access_token)
        })

    }

    _getRequest(url, qs, cb) {
        request(url, {
            headers: {
                'Client-ID': this.clientId,
            },
            qs: qs
        }, (error, resp, rawBody) => {
            cb(JSON.parse(rawBody).data[0])
        })
    }

    getUser(login, cb) {
        this._getRequest(userUrl, {
            login: login,
        }, cb)
    }

    getStream(login, cb) {
        this._getRequest(streamUrl, {
            user_login: login,
        }, cb)
    }
}

module.exports = Twitch