#!/usr/bin/env node

const ToStreamable = require('./')
const minimist = require('minimist')
const appCfg = require('application-config')
const prompt = require('prompt')
const request = require('request')
const concat = require('concat-stream')
const fileType = require('file-type')
const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')

const argv = minimist(process.argv.slice(2), {
  boolean: true,
  alias: {
    version: 'v',
    help: 'h'
  }
})
const config = appCfg('to-streamable')
const promptSchema = {
  properties: {
    username: {
      required: true,
      message: 'Username: '
    },

    password: {
      hidden: true,
      required: true,
      message: 'Password: '
    }
  }
}
prompt.message = ''
prompt.delimiter = ''
prompt.colors = false

function printHelp () {
  return fs.createReadStream(path.resolve(__dirname, '../help.txt'))
    .pipe(process.stdout)
    .on('close', function () { process.exit(1) })
}

function runCli () {
  if (argv.help) return printHelp()
  if (argv.version) {
    console.log(pkg.version)
    process.exit(0)
  }

  if (argv.setup) {
    prompt.start()

    prompt.get(promptSchema, (err, auth) => {
      if (err) throw err

      request({
        method: 'POST',
        url: 'http://streamable.com/ajax/check',
        json: true,
        body: auth
      }, function (err, res, body) {
        if (err) throw err
        if (res.statusCode === 200) {
          config.write(auth, err => {
            if (err) throw err
            console.log('Username and password saved successfully!')
            process.exit(0)
          })
        } else {
          console.log('Error: Invalid username/password.')
          process.exit(1)
        }
      })
    })
    return
  }

  config.read((err, auth) => {
    if (err) throw err

    if (argv.auth && typeof argv.auth === 'string') {
      const [username, password] = argv.auth.split(':')
      auth = { username, password }
    }

    if (!auth.username || !auth.password) {
      console.log('Error: No auth passed or previously saved. Run with either `--setup` or an auth pair using `--auth`.')
      return printHelp()
    }

    function doUpload (file) {
      const params = []
      if (argv['no-resize']) params.push('noresize')
      if (argv['mute']) params.push('mute')

      const upload = new ToStreamable({
        file, auth, params
      })

      console.log('Uploading...')
      upload.upload((err, body) => {
        if (err) throw err
        const shortcode = upload.shortcode

        console.log('Processing...')
        const poll = setInterval(() => {
          upload.status((err, body) => {
            if (err) throw err
            if (body.status === 2) {
              clearInterval(poll)
              console.log(`Done! http://streamable.com/${shortcode}`)
              process.exit(0)
            }
            if (body.status === 3) {
              clearInterval(poll)
              console.log(`Error: ${body.message}`)
              process.exit(1)
            }
          })
        }, 500)
      })
    }

    if (argv._[0] && typeof argv._[0] === 'string') {
      // file path was passed
      const file = fs.createReadStream(path.resolve(process.cwd(), argv._[0]))
      doUpload(file)
    } else {
      // no file path, use stdin
      const stream = concat(buf => {
        const info = fileType(buf)
        const file = {
          value: buf,
          options: {
            filename: `video.${info.ext}`,
            contentType: info.mime
          }
        }
        doUpload(file)
      })
      process.stdin.pipe(stream)
    }
  })
}

runCli()
