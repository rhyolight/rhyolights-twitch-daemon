const path = require('path')
const fs = require('fs')
const jsyaml = require('js-yaml')

const INITIAL_CONFIG = {
  voters: [],
  votes: [],
}

const WATCHER_MAX = 10
const FOLLOWER_MAX = 50

const CONTESTS = {
  debate: "The winner of the debate.",
  tech: "Best technical arguments.",
}

const CANDIDATES = {
  gary: "Gary Marcus",
  yoshua: "Yoshua Bengio",
}

class DebateMonitor {

  constructor(path, twitch) {
    this.path = path
    this.twitch = twitch
  }

  load() {
    console.log('load')
    let debateFile = path.join(this.path, 'debate.yml')
    this.data = jsyaml.load(fs.readFileSync(debateFile, 'utf8'))
  }

  save(data) {
    console.log('save')
    let debateFile = path.join(this.path, 'debate.yml')
    fs.writeFileSync(debateFile, jsyaml.dump(data), 'utf8')
    this.createScoreboard()
  }

  init() {
    if (fs.existsSync(this.path)) {
      this.load()
    } else {
      this.save(INITIAL_CONFIG)
    }
  }

  usage() {
    return `
    The Vote command is "!vote <points> <candidate> [contest]"\n           
    The default [contest] is the main debate. Use "!vote list" to see results.\n     
    Use "!vote candidates" and "!vote contests" for more info.
    Followers get ${FOLLOWER_MAX} points to award. Everyone else gets 
    ${WATCHER_MAX}.
    `
  }
  
  generateErrorMessage(err) {
    return `There was a problem with your vote! The error was "${err}"\n ${this.usage()} `       
  }

  createScoreboard() {
    let me = this
    let contests = {}
    let votes = this.data.votes
    Object.keys(votes).forEach(username => {
      votes[username].forEach(vote => {
        // Prime the data structure
        if (! contests[vote.contest]) {
          let votes = []
          Object.keys(CANDIDATES).forEach(k => {
            votes.push({
              candidate: k,
              score: 0
            })
          })
          contests[vote.contest] = votes
        }
        // console.log(vote.candidate)
        // console.log(contests[vote.contest])
        contests[vote.contest].find(el => el.candidate === vote.candidate).score += vote.score
      })
    })
    // console.log(votes)
    // console.log(contests)
    Object.keys(contests).forEach(contestKey => {
      let out = ""
      let contestName = CONTESTS[contestKey]
      let votes = contests[contestKey]
      out += `${contestName} (${contestKey})\n`
      out += `!vote <points> <name> ${contestKey}\n\n`
      // console.log(votes)
      votes.sort((a, b) => {
        if (a.score > b.score) return -1
        if (a.score < b.score) return 1
        return 0
      }).forEach(vote => {
        out += `\t${vote.score} ${CANDIDATES[vote.candidate]} (${vote.candidate})\n`
      })
      let filePath = path.join(me.path, `${contestKey}.txt`)
      console.log(`saving scoreboard for ${contestKey} at ${filePath}`)
      fs.writeFileSync(filePath, out, 'utf8')
    })
  }

  validateVote(vote, max) {
    // Check score
    if (Number.isNaN(vote.score) || ! Number.isInteger(vote.score)) {
      this.error = new Error(`Invalid score ${vote.score}`)
      return false
    }
    // Check candidate
    if (Object.keys(CANDIDATES).indexOf(vote.candidate.toLowerCase()) < 0) {
      this.error = new Error(`Invalid candidate ${vote.candidate}`)
      return false
    }
    // Check contest
    if (Object.keys(CONTESTS).indexOf(vote.contest.toLowerCase()) < 0) {
      this.error = new Error(`Invalid contest ${vote.contest}`)
      return false
    }
    return true
  }

  vote(args, context, cb) {
    let voteMax = WATCHER_MAX
    let me = this

    if (args[0] == 'votes') {
      cb(null, "votes", me.data.votes)
    } else if (args[0] == 'candidates') {
      cb(null, "candidates", CANDIDATES)
    } else if (args[0] == 'contests') {
      cb(null, "contests", CONTESTS)
    } else if (args[0] == 'score') {
      cb(null, "score", me.createScoreboard())
    } else {
      
      let userFollow = function(resp) {
        if (resp) {
          voteMax = FOLLOWER_MAX
        }
        if (! me.data.votes[context.username]) {
          me.data.votes[context.username] = []
        }
        let vote = {
          score: parseInt(args[0]),
          candidate: args[1],
          contest: args[2] || 'debate',
        }
        if (me.validateVote(vote, voteMax)) {
          console.log('voting...')
          me.data.votes[context.username].push(vote)
          me.save(me.data)
          cb(null, "You voted!", vote)
        } else {
          console.log('INVALID VOTE!')
          cb(me.error)
        }
      }

      let myId = '53666502'

      if (context['user-id'] == myId) {
        userFollow(true, cb)
      } else {
        this.twitch.userFollows(myId, context['user-id'], userFollow)
      }
    }

  }

}

module.exports = DebateMonitor
