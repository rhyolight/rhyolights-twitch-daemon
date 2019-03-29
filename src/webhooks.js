let request = require('request')

let subUrl = 'https://api.twitch.tv/helix/webhooks/hub'


class Webhooks {

    constructor(user, callbackUrl, appToken) {
        this.user = user
        this.callbackUrl = callbackUrl
        this.appToken = appToken
    }

    updateWebhookSubscriptions() {
        let me = this
        let user = this.user
        me.clearExistingSubs((subs) => {
            // create a new stream monitor
            let streamsSub = `https://api.twitch.tv/helix/streams?user_id=${user.id}`
            let usersSub = `https://api.twitch.tv/helix/users?id=${user.id}`
            me.webhookSubscribe('subscribe', streamsSub);
        })
    }

    clearExistingSubs(cb) {
        let me = this
        let user = this.user
        let appToken = this.appToken
        let payload = {
            url: 'https://api.twitch.tv/helix/webhooks/subscriptions',
            headers: {
                'Client-ID': user.login,
                'Authorization': `Bearer ${appToken}`,
            }
        }
        console.log('searching for existing webhooks...')
        request(payload, (error, resp, rawBody) => {
            let hooks = JSON.parse(rawBody).data
            console.log(`Removing ${hooks.length} subscriptions...`)
            // can delete these asynchronously
            hooks.forEach(hook => {
                me.webhookSubscribe('unsubscribe', hook.topic)
            })
            cb()
        })
    }

    webhookSubscribe(mode, topic) {
        let callbackUrl = this.callbackUrl
        let clientId = this.user.login
        let appToken = this.appToken
        console.log(`WEBHOOK ${mode} for ${topic}`)
        request.post({
            url: subUrl,
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${appToken}`,
            },
            json: {
                'hub.callback': callbackUrl,
                'hub.mode': mode,
                'hub.lease_seconds': 864000,
                'hub.topic': topic,
            },
        }, function (error, response, body) {
            if (response && response.statusCode === 202) {
                console.log('Webhook subscription change accepted.')
            } else {
                console.log(body)
            }
        })
    }
}

module.exports = Webhooks