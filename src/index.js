/**
 * to-streamable - Upload video quickly to Streamable.com
 * @author Zach Bruggeman <mail@bruggie.com>
 * @package to-streamable
 */

import request from 'request'

const noop = function noop () {}

export default class ToStreamable {
  constructor (opts={}) {
    this.opts = opts
    this.shortcode = null
  }

  upload (cb=noop) {
    let { file, auth, params=[] } = this.opts

    if (!file) return cb(new Error('No file specified'))
    if (!auth) return cb(new Error('No auth specified'))

    let paramString = ''
    if (params.length > 0) {
      paramString = `?${params.join('&')}`
    }

    let req = request({
      method: 'POST',
      url: `https://api.streamable.com/upload${paramString}`,
      formData: { file },
      json: true,
      auth
    }, (err, res, body) => {
      let [ { shortcode } ] = body
      this.shortcode = shortcode
      return cb(err, body)
    })

    return req
  }

  status (cb=noop) {
    let { auth } = this.opts
    let shortcode = this.shortcode

    if (!shortcode) return cb(new Error('No shortcode, upload file first'))

    let req = request({
      method: 'GET',
      url: `https://api.streamable.com/videos/${shortcode}`,
      json: true,
      auth
    }, (err, res, body) => cb(err, body))

    return req
  }
}
