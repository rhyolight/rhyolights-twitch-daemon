const fs = require('fs')
const path = require('path')

const tmi = require('tmi.js');
const play = require('play')

const parseDuration = require('parse-duration')

const DebateMonitor = require('./debate-monitor')

const sounds = fs.readdirSync(path.join(__dirname, '../resources/sounds'))

// function stringSubTag(strings, argsExpr) {
// }

class Chatbot {

  constructor(name, channel, oath, commands, obsClient, twitchClient) {
    this.name = name
    this.channel = channel
    this.oath = oath
    this.commands = commands
    this.obsClient = obsClient
    this.debateMonitor = new DebateMonitor('obs-files', twitchClient)
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
    client.connect()

    // Initialize debate monitor
    this.debateMonitor.init()
  }

  listCommands(target) {
    let cmds = Object.keys(this.commands).join(' ')
    this.client.say(target, `Available commands: ${cmds}`)
  }

  countdown(target, time) {
    let duration = parseDuration(time)
    let remaining = duration
    this.client.say(target, `Starts in: ${remaining}ms`)
  }

  playSound(sound) {
    let soundFile = path.join(__dirname, '../resources/sounds', `${sound}.wav`)
    console.log(`playing sound from ${soundFile}`)
    play.sound(soundFile);
  }

  listSounds(target) {
    const soundList = sounds.map(f => {
      return f.split('.').shift()
    }).join(', ')
    this.client.say(target, `Available sounds for !sound command: ${soundList}`)
  }

  onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
  }

  onMessageHandler(target, context, msg, self) {
    // Ignore messages from the bot
    if (self) {
      return
    }
    const args = msg.trim().split(/\s+/)
    const commandName = args.shift();
    const username = context.username

    // console.log(`Recieved message "${msg}"`)
    // console.log(`command: "${commandName}"`)
    // console.log(`args: ${args}`)

    // Ignore anything not starting with '!'
    if (!commandName.startsWith('!')) {
      return
    }

    // The '!commands' command is special
    if (commandName === '!commands') {
      this.listCommands(target)
      // The '!countdown' command is special
    } else if (commandName === '!countdown') {
      this.countdown(target, args[0])
      // The '!sound' command is special
    } else if (commandName === '!sound') {
      // this.playSound(args[0])
      if (context.subscriber) {
        this.playSound(args[0])
      } else {
        this.client.say(target, 'You must be a subscriber to play sounds.')
      }
    } else if (commandName === '!sounds') {
      this.listSounds(target)
    } else if (commandName === '!mindblown') {
      this.playSound('mindblown')
      this.obsClient.mindblown()
    } else if (commandName === '!window') {
      this.obsClient.window()
    } else if (commandName === '!vote') {
      let me = this
      this.debateMonitor.vote(args, context, function(err, message, result) {
        if (err) {
          me.client.say(
            target, 
            `Invalid vote from ${username}: ${err}\n (use "!vote help")`
          )
          // me.client.say(target, me.debateMonitor.usage())
        } else if (message == "help") {
          // console.log('help')
          me.client.say(target, result)
        } else if (message == "votes") {
          let msgOut = `${username}`
          result.votes.forEach(v => {
            msgOut += `you gave ${v.score} ${v.contest} points to ${v.candidate}\n `
          })
          msgOut += `you have ${result.left} points left`
          me.client.whisper(context.username, msgOut)
        } else if (message == "candidates") {
          Object.keys(result).forEach(key => {
            me.client.say(target, `Use "${key}" to vote for ${result[key]}`)
          })
        } else if (message == "contests") {
          Object.keys(result).forEach(key => {
            me.client.say(target, `Use "${key}" to vote in for "${result[key]}"`)
          })
        } else if (message == "clear") {
          // pass
          me.client.say(target, `${username} cleared all their points!`)
        } else {
          // vote success
          me.client.say(target,
            `${username} gave ${result.score} ${result.contest} points to ${result.candidate}!\n 
            (and has ${result.left} points left)`
          )
        }
      })
    } else {
      // If the command is known, let's execute it
      let cmd = this.commands[commandName];
      if (cmd) {
        let reply = cmd.text
        this.client.say(target, reply)
        console.log(`* Executed ${commandName} command`);
      } else {
        console.log(`* Unknown command ${commandName}`);
      }
    }
  }

}

module.exports = Chatbot
