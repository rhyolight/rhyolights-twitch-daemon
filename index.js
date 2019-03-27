const BOT_USERNAME = process.env.BOT_USERNAME
const OAUTH_TOKEN = process.env.OAUTH_TOKEN
const CHANNEL_NAME = process.env.CHANNEL_NAME

let Chatbot = require('src/chatbot.js')
let chatbot = new Chatbot(BOT_USERNAME, CHANNEL_NAME, OAUTH_TOKEN)

chatbot.start()