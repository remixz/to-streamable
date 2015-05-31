# to-streamable

Upload video quickly to [Streamable](http://streamable.com).

[![Build Status](https://travis-ci.org/remixz/to-streamable.svg?branch=master)](https://travis-ci.org/remixz/to-streamable)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Installation

[![NPM](https://nodei.co/npm/to-streamable.png)](https://nodei.co/npm/to-streamable/)

```
npm install -g to-streamable
```

## Usage

```
Usage: to-streamable [options] [path to video file]
If no video path is passed, then stdin is used.

Options:

  --help, -h     Prints this help message.

  --version, -v  Prints current version.

  --setup        Launches a wizard to save Streamable username and password.

  --auth         Sets the username and password used for uploading.
                 Must be in a colon pair. `to-streamable --auth=user:pass`
                 If passed, this is preferred over any saved authentication.

  --no-resize    Tells Streamable to not resize final video.

  --mute         Tells Streamable to mute final video.
```

## API

### `let vid = require('to-streamable')(<opts>)`

Returns a new `to-streamable` instance. `opts` is an object. Valid parameters:

* `file` - A `Readable` stream of the video. (i.e. `fs.createReadStream('/path/to/video')`) This is passed to `request`'s `formData` option. Required.
* `auth` - An object containing a `username` and `password` property of your Streamable credentials. Required.
* `params` - An array of parameters to add to the request. Valid options are `noresize` and `mute`. See the [Streamable API Docs](http://streamable.com/documentation) for more info.

Example:

```js
let opts = {
  file: fs.createReadStream('/path/to/file'),
  auth: {
    username: 'foo',
    password: 'bar'
  },
  params: ['mute']
}
```

### `vid.upload([cb(err, res)])`

Starts the upload of the video. `cb` is an optional callback function. Called with parameters `err`, containing an `Error`, if any, and `res`, with the array response from the Streamable API. See the [Streamable API Docs](http://streamable.com/documentation) for format.

### `vid.status([cb(err, res)])`

Retrieves the status of the video upload. `vid.upload()` must be called beforehand. `cb` is an optional callback function. Called with parameters `err`, containing an `Error`, if any, and `res`, with the object response from the Streamable API. See the [Streamable API Docs](http://streamable.com/documentation) for format.

## Development

`to-streamable` is written in the shiniest new ES6, and is compiled with [Babel](https://babeljs.io/). Whenever you make a change, you must run `npm run build` to recompile the module. One day, ES6 shall rule the land, and this workaround won't be needed anymore.
