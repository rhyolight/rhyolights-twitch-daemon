const fs = require('fs')
const jsyaml = require('js-yaml')

const INITIAL_CONFIG = {
  voters: [],
  votes: [],
}

const WATCHER_MAX = 10
const FOLLOWER_MAX = 50

class DebateMonitor {

  constructor(path, twitch) {
    this.path = path
    this.twitch = twitch
  }

  load() {
    console.log('load')
    this.data = jsyaml.load(fs.readFileSync(this.path, 'utf8'))
  }

  save(data) {
    console.log('save')
    fs.writeFileSync(this.path, jsyaml.dump(data), 'utf8')
  }

  init() {
    if (fs.existsSync(this.path)) {
      this.load()
    } else {
      this.save(INITIAL_CONFIG)
    }
  }

  vote(args, context, cb) {
    let voteMax = WATCHER_MAX
    let me = this

    const command = args[0]

    if (command == 'list') {
      let out = ""
      me.data.votes.forEach(d => {
        out += `${d.voter} gave ${d.vote[0]} to ${d.vote[1]}\n              `
      })
      cb(out)
    } else {
      this.twitch.userFollows('53666502', context['user-id'], function(resp) {
        if (resp) {
          voteMax = FOLLOWER_MAX
        }
        me.data.votes.push({
          voter: context.username,
          vote: args,
        })
        me.save(me.data)
        cb("You voted.")
      })
  
    }

  }

}

module.exports = DebateMonitor
