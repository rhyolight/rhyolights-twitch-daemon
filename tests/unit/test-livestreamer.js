const assert = require('chai').assert
const expect = require('chai').expect

const LiveStreamer = require('../../src/live-streamer')

const mockPayload = {
    id: '33842376736',
    user_id: '53666502',
    user_name: 'rhyolight_',
    game_id: '509670',
    community_ids: [],
    type: 'live',
    title:
        'Numenta Research Meeting | artificial general intelligence, AGI, computational neuroscience',
    viewer_count: 10,
    started_at: '2019-04-24T17:10:21Z',
    language: 'en',
    thumbnail_url:
        'https://static-cdn.jtvnw.net/previews-ttv/live_user_rhyolight_-{width}x{height}.jpg',
    tag_ids:
        ['6f86127d-6051-4a38-94bb-f7b475dde109',
            'cea7bc0c-75a5-4446-8743-6db031b71550',
            'a59f1e4e-257b-4bd0-90c7-189c3efbf917',
            'dff0aca6-52fe-4cc4-a93a-194852b522f0',
            '26befb18-4ddc-41c1-8d39-ffeada297428',
            '6ea6bca4-4712-4ab9-a906-e3336a9d8039']
}

describe('when livestreamer processes a stream payload', () => {
    let stubClient = {
        authenticate: (token) => {
            
        },
        getStream: (login) => {

        }
    }
    let liveStreamer = new LiveStreamer(
        'targetLogin',
        stubClient
    )
    let filePath = 'filePath'
    liveStreamer.startFileStream(filePath)

    it('writes out a title.txt', () => {
        // assert.fail('not implemented')
    })

})

describe('when startFileStream is called', () => {
    it('calls updateStream at appropriate time intervals', () => {
        // assert.fail('not implemented')
    })
})
