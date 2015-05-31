#!/usr/bin/env node

import ToStreamable from './'
import minimist from 'minimist'
import appCfg from 'application-config'
import prompt from 'prompt'
import request from 'request'
import fs from 'fs'
import path from 'path'
import pkg from '../package.json'

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
  return fs.createReadStream(__dirname + '/../help.txt')
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
      let [username, password] = argv.auth.split(':')
      auth = { username, password }
    }

    if (!auth.username || !auth.password) {
      console.log('Error: No auth passed or previously saved. Run with either `--setup` or an auth pair using `--auth`.')
      return printHelp()
    }

    let file = null
    if (argv._[0] && typeof argv._[0] === 'string') {
      file = fs.createReadStream(path.resolve(process.cwd(), argv._[0]))

      let params = []
      if (argv['no-resize']) params.push('noresize')
      if (argv['mute']) params.push('mute')

      let upload = new ToStreamable({
        file, auth, params
      })

      console.log('Uploading...')
      upload.upload((err, body) => {
        if (err) throw err
        let shortcode = upload.shortcode

        console.log('Processing...')
        let poll = setInterval(() => {
          upload.status((err, body) => {
            if (err) throw err
            if (body.status === 2) {
              clearInterval(poll)
              console.log(`Done! http://streamable.com/${shortcode}`)
            }
          })
        }, 500)
      })
    } else {
      console.log('Error: No file path passed.')
      return printHelp()
    }
  })
}

runCli()
