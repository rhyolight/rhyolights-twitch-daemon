const assert = require('chai').assert
const expect = require('chai').expect

const Chatbot = require('../../src/chatbot')

const mockChatCommands = {
    "!foo": {
        text: "bar"
    }
}

describe('when parsing commands', () => {

    let chatbot = new Chatbot(
        'BOT_USERNAME',
        'CHANNEL_NAME',
        'OAUTH_TOKEN',
        mockChatCommands,
    )
    let reply
    let receivedTarget
    chatbot.client = {
        say: (tgt, msg) => {
            reply = msg
            receivedTarget = tgt
        }
    }

    it('ignores messages from itself', () => {
        let target
        let context
        let msg
        let self = chatbot
        chatbot.onMessageHandler(target, context, msg, self)
        assert.isUndefined(reply, 'bot responded to itself')
    })

    it('ignores messages that do not start with "!"', () => {
        let target
        let context
        let msg = 'foo'
        let self
        chatbot.onMessageHandler(target, context, msg, self)
        assert.isUndefined(reply, 'bot responded to a non-chat command')
    })

    it('responds to ! messages with specified text', () => {
        let target = 'tgt'
        let context
        let msg = '!foo'
        let self
        chatbot.onMessageHandler(target, context, msg, self)
        assert.equal(reply, 'bar', 'bot failed to parrot back "bar" given "!foo"')
        assert.equal(receivedTarget, target, 'bot sent message to wrong target')
    })


})
