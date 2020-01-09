const path = require('path')
const fs = require('fs')
const jsyaml = require('js-yaml')

const INITIAL_CONFIG = {
  votes: {},
}

let myId = '53666502'

const WATCHER_MAX = 10
const FOLLOWER_MAX = 100

const CONTESTS = {
  overall: "best overall",
  technical: "best technical arguments",
  delivery: "best delivery of arguments",
  science: "best grounding in hard science",
  rebuttal: "best rebuttals",
  // style: "best costume",
  // control: "play control",
  // attack: "best attacks",
}

const CANDIDATES = {
  gary: "Gary Marcus",
  yoshua: "Yoshua Bengio",
  // yann: "Yann LeCun",
  // sonic: "Sonic Hedgehog",
  // mario: "Mario",
  // samus: "Samus Aran",
}

class DebateMonitor {

  constructor(path, twitch) {
    this.path = path
    this.twitch = twitch
  }

  load() {
    console.log('load')
    let debateFile = path.join(this.path, 'debate.yml')
    let data = jsyaml.load(fs.readFileSync(debateFile, 'utf8'))
    this.data = data || INITIAL_CONFIG
  }

  save(data) {
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
    The Vote command is "!vote <points> <first name> <contest>"\n
    Everyone gets 100 points.\n
    Use "!vote clear" to clear all votes and start fresh.\n
    Use "!vote votes" to see your votes and remaining points.\n
    `
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
    // Talley scores for each contest
    Object.keys(votes).forEach(username => {
      votes[username].forEach(vote => {
        let contest = contests[vote.contest]
        if (! contest) throw new Error(`Missing contest ${vote.contest}`)
        contest.find(el => el.candidate === vote.candidate).score += vote.score
      })
    })

    // Write out contest .txt files for OBS
    Object.keys(contests).forEach(contestKey => {
      let out = ""
      let votes = contests[contestKey]
      out += `${contestKey.toUpperCase()} contest:\n`
      votes.sort((a, b) => {
        if (a.score > b.score) return -1
        if (a.score < b.score) return 1
        return 0
      }).forEach(vote => {
        if (vote.contest === contestKey) overall[contestKey] += vote.score
        out += `\t${CANDIDATES[vote.candidate].padEnd(15)}${vote.score.toString().padStart(5)}\n`
      })
      let filePath = path.join(me.path, `${contestKey}.txt`)
      // console.log(`saving scoreboard for ${contestKey} at ${filePath}`)
      fs.writeFileSync(filePath, out, 'utf8')
    })

    // Tally overall scores for main report
    let overall = []
    Object.keys(CANDIDATES).forEach(candidateKey => {
      overall.push({name: candidateKey, votes: 0})
    })
    Object.keys(votes).forEach(username => {
      votes[username].forEach(vote => {
        overall.find(c => c.name === vote.candidate).votes += vote.score
      })
    })

    // Write out overall.txt report
    let out = "Overall Scores:\n"
    overall.sort((a, b) => {
      if (a.votes > b.votes) return -1
      if (a.votes < b.votes) return 1
      return 0
    }).forEach(c => {
      let name = CANDIDATES[c.name].padEnd(15)
      let score = (""+c.votes).padStart(5)
      out += `\t${name}${score}\n`
    })
    let filePath = path.join(me.path, `overall.txt`)
    console.log(`saving overall scoreboard at ${filePath}`)
    fs.writeFileSync(filePath, out, 'utf8')

    // Write out voter report
    let voters = []
    Object.keys(votes).forEach(username => {
      let userVotes = votes[username]
      let totalVotes = userVotes.reduce((acc, curr) => {
        return acc += curr.score
      }, 0)
      voters.push({
        username: username,
        points: totalVotes,
      })
    })
    out = "Top Voters:\n"
    voters.sort((a, b) => {
      if (a.points > b.points) return -1
      if (a.points < b.points) return 1
      return 0
    }).forEach(voter => {
      out += `${voter.points.toString().padStart(4)}\t${voter.username}\n`
    })
    filePath = path.join(me.path, `voters.txt`)
    // console.log(`saving voter scoreboard at ${filePath}`)
      fs.writeFileSync(filePath, out, 'utf8')
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
    if (! vote.contest || Object.keys(CONTESTS).indexOf(vote.contest.toLowerCase()) < 0) {
      this.error = new Error(`Invalid contest ${vote.contest}`)
      return false
    }
    vote.candidate = vote.candidate.toLowerCase()
    vote.contest = vote.contest.toLowerCase()
    return true
  }

  validateVoter(username, vote, max) {
    let currentVotes = this.userVoteCount(username)
    if (currentVotes + vote.score > max) {
      this.error = new Error(`User has breached max votes of ${max}! (follow rhyolight_ for more votes)`)
      return false
    }
    return true
  }

  userFollowsMe(context, cb) {
    let userId = context['user-id']
    if (userId == myId) return cb(null, true)
    // this.twitch.userFollows(myId, userId, cb)
    cb(true)
  }

  vote(args, context, cb) {
    let me = this

    this.userFollowsMe(context, follows => {
      let voteMax = follows !== undefined ? FOLLOWER_MAX : WATCHER_MAX

      if (args[0] == 'votes') {
        let data = {}
        data.votes = me.data.votes[context.username]
        data.left = voteMax - me.userVoteCount(context.username)
        cb(null, "votes", data)
      } else if (args[0] == 'candidates') {
        cb(null, "candidates", CANDIDATES)
      } else if (args[0] == 'contests') {
        cb(null, "contests", CONTESTS)
      } else if (args[0] == 'clear') {
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
            contest: args[2],
          }
          if (me.validateVote(vote) 
          && me.validateVoter(context.username, vote, voteMax)) {
            console.log('voting...')
            me.data.votes[context.username].push(vote)
            me.save(me.data)
            vote.left = voteMax - me.userVoteCount(context.username)
            cb(null, "success", vote)
          } else {
            cb(me.error)
          }
      }

    })

  }

}

module.exports = DebateMonitor
