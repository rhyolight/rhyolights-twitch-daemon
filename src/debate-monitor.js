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

  validateVote(vote) {
    // score is an integer
    if (! Number.isInteger(vote.score)) {
      this.error = new Error(`Invalid score ${vote.score}`)
      return false
    }
    return true
  }

  vote(args, context, cb) {
    let voteMax = WATCHER_MAX
    let me = this

    if (args[0] == 'list') {
      let out = ""
      Object.keys(me.data.votes).forEach(key => {
        let username = key
        let votes = me.data.votes[key]
        votes.forEach(vote => {
          out += `${username} gave ${vote.score} to ${vote.candidate}\n`
        })
      })
      cb(null, out)
    } else {
      
      let userFollow = function(resp) {
        console.log(arguments)
        console.log(resp)
        if (resp) {
          voteMax = FOLLOWER_MAX
        }
        if (! me.data.votes[context.username]) {
          me.data.votes[context.username] = []
        }
        let vote = {
          score: parseInt(args[0]),
          candidate: args[1],
        }
        if (me.validateVote(vote)) {
          me.data.votes[context.username].push(vote)
          me.save(me.data)
          cb(null, "You voted.")
        } else {
          cb(me.error)
        }
      }

      let myId = '53666502'

      if (context['user-id'] == myId) {
        userFollow(true)
      } else {
        this.twitch.userFollows(myId, context['user-id'], userFollow)
      }
    }

  }

}

module.exports = DebateMonitor
