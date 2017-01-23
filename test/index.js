var tap = require('tap')
var fs = require('fs')
var ToStreamable = require('../')

var upload = new ToStreamable({
  file: fs.createReadStream(__dirname + '/brule.mp4'),
  auth: {
    username: 'tostreamabletest',
    password: 'test123'
  }
})

tap.test('upload', function (t) {
  upload.upload(function (err, res) {
    t.error(err, 'should be no errors')
    t.equal(res.status, 1, 'correct status should be returned')
    t.type(res.shortcode, 'string', 'should have a proper shortcode')
    t.end()
  })
})

tap.test('status', function (t) {
  t.type(upload.shortcode, 'string', 'should have a shortcode set from uploading')
  upload.status(function (err, res) {
    t.error(err, 'should be no errors')
    t.type(res, 'object', 'should return an object')
    t.type(res.status, 'number', 'status should be a number')
    t.end()
  })
})
