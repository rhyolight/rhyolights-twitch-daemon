const fs = require('fs')
const path = require('path')
const jsyaml = require('js-yaml')
const startServer = require('./src/http-server')
const Chatbot = require('./src/chatbot.js')
const LiveStreamer = require('./src/live-streamer')
const Twitch = require('./src/twitch')

const ObsClient = require('./src/obs-client');

const BOT_USERNAME = process.env.BOT_USERNAME
const OAUTH_TOKEN = process.env.OAUTH_TOKEN
const CHANNEL_NAME = process.env.CHANNEL_NAME
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

// The Twitch user to monitor
let targetLogin = 'rhyolight_'

let obsClient = new ObsClient()
let chatbot = new Chatbot(
    BOT_USERNAME,
    CHANNEL_NAME,
    OAUTH_TOKEN,
    jsyaml.load(fs.readFileSync('resources/chat-commands.yaml', 'utf8')),
    obsClient
)

obsClient.start()
chatbot.start()

startServer(targetLogin, CLIENT_ID, CLIENT_SECRET)

let filePath = path.join(__dirname, 'obs-files')
let twitchClient = new Twitch(CLIENT_ID, CLIENT_SECRET)
let liveStreamer = new LiveStreamer(
    targetLogin,
    twitchClient
)
liveStreamer.startFileStream(filePath)
