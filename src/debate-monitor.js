const path = require('path')
const fs = require('fs')
const jsyaml = require('js-yaml')

const INITIAL_CONFIG = {
  voters: [],
  votes: [],
}
let myId = '53666502'

const WATCHER_MAX = 10
const FOLLOWER_MAX = 100

const CONTESTS = {
  debate: "The winner of the debate.",
  tech: "Best technical arguments.",
  style: "Who got style?",
  
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
    The default [contest] is the main debate.\n                  
    Use "!vote candidates" and "!vote contests" for more info.                  
    Followers get ${FOLLOWER_MAX} points to award. Everyone else gets 
    ${WATCHER_MAX}.                       
    Use "!vote clear" to clear all votes and start fresh.
    Use "!vote votes" to see your votes and remaining points.
    `
  }
  
  generateErrorMessage(err) {
    return `There was a problem with your vote! The error was "${err}"\n ${this.usage()} `       
  }

  userVoteCount(username) {
    let count = 0
    let votes = this.data.votes[username]
    if (!votes) return 0
    votes.forEach(vote => {
      count += vote.score
    })
    return count
  }

  createScoreboard() {
    let me = this
    let contests = {}
    let votes = this.data.votes


    // Prime the data structure
    Object.keys(CONTESTS).forEach(contestKey => {
      contests[contestKey] = []
      Object.keys(CANDIDATES).forEach(candidateKey => {
        contests[contestKey].push({
          candidate: candidateKey,
          score: 0,
        })
      })
    })

    Object.keys(votes).forEach(username => {
      votes[username].forEach(vote => {
        contests[vote.contest].find(el => el.candidate === vote.candidate).score += vote.score
      })
    })

    Object.keys(contests).forEach(contestKey => {
      let out = ""
      let contestName = CONTESTS[contestKey]
      let votes = contests[contestKey]
      out += `Live "${contestKey}" Rankings\n\n`
      votes.sort((a, b) => {
        if (a.score > b.score) return -1
        if (a.score < b.score) return 1
        return 0
      }).forEach(vote => {
        out += `\t${vote.score}\t${CANDIDATES[vote.candidate]}\n`
      })
      let filePath = path.join(me.path, `${contestKey}.txt`)
      console.log(`saving scoreboard for ${contestKey} at ${filePath}`)
      fs.writeFileSync(filePath, out, 'utf8')
    })
  }

  validateVote(vote) {
    // Check score
    if (Number.isNaN(vote.score) 
    || ! Number.isInteger(vote.score)
    || vote.score < 1) {
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

  validateVoter(username, vote, max) {
    console.log(username)
    console.log(vote)
    let currentVotes = this.userVoteCount(username)
    if (currentVotes + vote.score > max) {
      this.error = new Error(`User has breached max votes of ${max}`)
      return false
    }
    return true
  }

  userFollowsMe(context, cb) {
    let userId = context['user-id']
    if (userId == myId) return cb(null, true)
    this.twitch.userFollows(myId, userId, cb)
  }

  vote(args, context, cb) {
    let me = this

    this.userFollowsMe(context, follows => {
      let voteMax = follows !== undefined ? FOLLOWER_MAX : WATCHER_MAX

      if (args[0] == 'votes') {
        let data = {}
        data.votes = me.data.votes[context.username]
        console.log(voteMax)
        console.log(me.userVoteCount(context.username))
        data.left = voteMax - me.userVoteCount(context.username)
        cb(null, "votes", data)
      } else if (args[0] == 'candidates') {
        cb(null, "candidates", CANDIDATES)
      } else if (args[0] == 'contests') {
        cb(null, "contests", CONTESTS)
      } else if (args[0] == 'clear') {
        // if (context.username !== 'rhyolight_') return cb(new Error('UNAUTHORIZED'))
        me.data.votes[context.username] = []
        me.save(me.data)
        cb(null, "clear")
      } else if (args[0] == 'help') {
        cb(null, 'help', this.usage())
      } else {
          if (! me.data.votes[context.username]) {
            me.data.votes[context.username] = []
          }
          let vote = {
            score: parseInt(args[0]),
            candidate: args[1],
            contest: args[2] || 'debate',
          }
          if (me.validateVote(vote) 
          && me.validateVoter(context.username, vote, voteMax)) {
            console.log('voting...')
            me.data.votes[context.username].push(vote)
            me.save(me.data)
            vote.left = voteMax - me.userVoteCount(context.username)
            cb(null, `you have ${vote.left} points remaining`, vote)
          } else {
            console.log('INVALID VOTE!')
            cb(me.error)
          }
      }

    })

  }

}

module.exports = DebateMonitor
