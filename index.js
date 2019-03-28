const fs = require('fs')
const jsyaml = require('js-yaml')

const BOT_USERNAME = process.env.BOT_USERNAME
const OAUTH_TOKEN = process.env.OAUTH_TOKEN
const CHANNEL_NAME = process.env.CHANNEL_NAME

let Chatbot = require('./src/chatbot.js')
let chatbot = new Chatbot(
    BOT_USERNAME,
    CHANNEL_NAME,
    OAUTH_TOKEN,
    jsyaml.load(fs.readFileSync('resources/chat-commands.yaml', 'utf8'))
)

chatbot.start()