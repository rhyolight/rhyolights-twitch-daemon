let http = require('http');
let express = require('express')
let io = require('socket.io')
let bodyParser = require('body-parser')

// I wrote these classes
let Webhooks = require('./webhooks')
let Twitch = require('./twitch')

// Server settings.
let baseUrl = 'http://localhost'
if (process.env.HEROKU_URL) {
    baseUrl = process.env.HEROKU_URL
}
let hookUrl = baseUrl + '/_twitch_webhooks'
const port = process.env.PORT || 8081

// Create server and comms.
const app = express()
app.use(bodyParser.json())
let server = http.Server(app);
let socket = io(server);

// This serves the static files for the JS client program.
app.use(express.static('static'))

// For confirming webhook subscriptions (GET).
app.get('/_twitch_webhooks', (req, res) => {
    console.log('confirming webhook')
    let q = req.query
    // this could be a subscription challenge
    if (q['hub.mode']) {
        let code = q['hub.challenge']
        console.log('returning hub.challenge')
        res.status(200).end(code)
    } else {
        res.status(400).end()
    }
})

// This is the URL that Twitch will call with webhook subscription updates.
app.post('/_twitch_webhooks', (req, res) => {
    console.log('webhook received!')
    let q = req.query
    console.log(q)
    socket.emit('stream', q.data[0])
    res.end()
})

function startServer(twitch, login) {
    server.listen(port, function(){
        console.log(`serving HTML from ${baseUrl}:${port}/index.html`)
        console.log(`listening on *:${port}`);
    });
    socket.on('connect', function(){
        console.log('Connected to socket client.')
        twitch.getStream(login, (stream) => {
            socket.emit('stream', stream)
        })
    });
    socket.on('disconnect', function(){
        console.log('Disconnected from socket client.')
    });
}

module.exports = (targetLogin, clientId, clientSecret) => {
// Program start
    let twitch = new Twitch(clientId, clientSecret)
    startServer(twitch, targetLogin)
    twitch.authenticate((token) => {
        if (! token) throw new Error('Cannot get app token')
        twitch.getUser(targetLogin, (user) => {
            // let webhooks = new Webhooks(user, hookUrl, token)
            // webhooks.updateWebhookSubscriptions(user, token)
            // Every minute, poll for updated stream data
            setTimeout(() => {
                twitch.getStream(user.login, (stream) => {
                    socket.emit('stream', stream)
                })
            }, 1000*60)
        })
    })
}
