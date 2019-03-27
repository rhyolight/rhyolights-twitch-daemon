const tmi = require('tmi.js');

class Chatbot {

    constructor(name, channel, oath) {
        this.name = name
        this.channel = channel
        this.oath = oath
    }

    static rollDice() {
        const sides = 6;
        return Math.floor(Math.random() * sides) + 1;
    }

    static onConnectedHandler(addr, port) {
        console.log(`* Connected to ${addr}:${port}`);
    }

    start() {
        // Create a client with our options
        let client = this.client = new tmi.client({
            identity: {
                username: this.name,
                password: this.oath,
            },
            channels: [
                this.channel
            ]
        });
        // Register our event handlers (defined below)
        client.on('message', this.onMessageHandler);
        client.on('connected', Chatbot.onConnectedHandler);

        // Connect to Twitch:
        client.connect();
    }

    onMessageHandler(target, context, msg, self) {
        if (self) {
            return;
        } // Ignore messages from the bot

        // Remove whitespace from chat message
        const commandName = msg.trim();

        // If the command is known, let's execute it
        if (commandName === '!dice') {
            const num = Chatbot.rollDice();
            client.say(target, `You rolled a ${num}`);
            console.log(`* Executed ${commandName} command`);
        } else {
            console.log(`* Unknown command ${commandName}`);
        }
    }
}

module.exports = Chatbot