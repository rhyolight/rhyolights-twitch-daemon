const assert = require('chai').assert
const expect = require('chai').expect

const Chatbot = require('../../src/chatbot')

const mockChatCommands = {
    "!foo": {
        text: "bar"
    }
}

describe('when starting up', () => {
    it('connects to twitch', () => {

    })
})

let freshBot = (commands) => {
    let chatbot = new Chatbot(
        'BOT_USERNAME',
        'CHANNEL_NAME',
        'OAUTH_TOKEN',
        commands || mockChatCommands,
    )
    let reply
    let receivedTarget
    chatbot.client = {
        say: (tgt, msg) => {
            chatbot.__reply = msg
            chatbot.__receivedTarget = tgt
        }
    }
    return chatbot
}

describe('when parsing commands', () => {

    it('ignores messages from itself', () => {
        let chatbot = freshBot()
        let target
        let context
        let msg
        let self = chatbot
        chatbot.onMessageHandler(target, context, msg, self)
        assert.isUndefined(chatbot.__reply, 'bot responded to itself')
    })

    it('ignores messages that do not start with "!"', () => {
        let chatbot = freshBot()
        let target
        let context
        let msg = 'foo'
        let self
        chatbot.onMessageHandler(target, context, msg, self)
        assert.isUndefined(chatbot.__reply, 'bot responded to a non-chat command')
    })

    it('responds to ! messages with specified text', () => {
        let chatbot = freshBot()
        let target = 'tgt'
        let context
        let msg = '!foo'
        let self
        chatbot.onMessageHandler(target, context, msg, self)
        assert.equal(chatbot.__reply, 'bar', 'bot failed to parrot back "bar" given "!foo"')
        assert.equal(chatbot.__receivedTarget, target, 'bot sent message to wrong target')
    })

    // it('args subbed into text', () => {
    //     let chatbot = freshBot({
    //         '!foo': {
    //             text: "foo called with '${args}'"
    //         }
    //     })
    //     let target = 'tgt'
    //     let context
    //     let msg = '!foo and my args'
    //     let expectedReply = 'foo called with \'and my args\''
    //     let self
    //     chatbot.onMessageHandler(target, context, msg, self)
    //     assert.equal(chatbot.__reply, expectedReply, 'bot failed to substitute command args')
    //     assert.equal(chatbot.__receivedTarget, target, 'bot sent message to wrong target')
    // })

})
