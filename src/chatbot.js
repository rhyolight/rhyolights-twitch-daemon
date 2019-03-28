const tmi = require('tmi.js');

class Chatbot {

    constructor(name, channel, oath, commands) {
        this.name = name
        this.channel = channel
        this.oath = oath
        this.commands = commands
    }

    start() {
        let me = this
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
        client.on('message', (target, context, msg, self) => {
            me.onMessageHandler(target, context, msg, self)
        });
        client.on('connected', (addr, port) => {
            this.onConnectedHandler(addr, port)
        });

        // Connect to Twitch:
        client.connect();
    }

    listCommands(target) {
        let cmds = Object.keys(this.commands).join(' ')
        this.client.say(target, `Available commands: ${cmds}`)
    }

    onConnectedHandler(addr, port) {
        console.log(`* Connected to ${addr}:${port}`);
    }

    onMessageHandler(target, context, msg, self) {
        // Ignore messages from the bot
        if (self) {
            return
        }

        // Remove whitespace from chat message
        const commandName = msg.trim();

        // Ignore anything not starting with '!'
        if (! commandName.startsWith('!')) {
            return
        }

        // The '!commands' command is special
        if (commandName === '!commands') {
            this.listCommands(target)
        } else {
            // If the command is known, let's execute it
            let cmd = this.commands[commandName];
            if (cmd) {
                this.client.say(target, cmd.text)
                console.log(`* Executed ${commandName} command`);
            } else {
                console.log(`* Unknown command ${commandName}`);
            }
        }
    }
}

module.exports = Chatbot