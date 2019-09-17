# webpack-cache-scripts-to-local

Apply localStorage cache JavaScript file

**Before**
![](https://s33.aconvert.com/convert/p3r68-cdx67/calqr-8vypo.gif)
**After**
![](https://s33.aconvert.com/convert/p3r68-cdx67/izxro-ykpud.gif)

## webpack version

4.0

## Install

```shell
$ npm install webpack-cache-scripts-to-local --save-dev
```

## Usage

```js
const WebpackCacheScriptsToLocal = require('webpack-cache-scripts-to-local')
module.exports = {
  plugins: [
    new WebpackCacheScriptsToLocal({
      name: 'test',
      separator: '-',
      driverName: ['indexedDB', 'webSQL', 'localStorage'],
      chunks: ['main']
    })
  ]
}
```

## Options

### name

This default value is `store`

The name of your repository, if stored in a local Storage, will be applied to the prefix of key; if stored in IndexedDB or WebSQL, it will be the name of the repository.

### separator

This value is necessary, default value is `-`

Specify the separation between the file name of your packaged JavaScript file and Hash.

### driverName

Choose a driver for your local storage, either one or more.

- localStorage
- webSQL
- localStorage

This default value is `[indexedDB, webSQL, localStorage]`

If the value is a string, then the driver of this value is applied.

```js
new WebpackCacheScriptsToLocal({
  name: 'test',
  separator: '-',
  driverName: 'localStorage'
})
```

If the value is an array, all the drivers in the array are applied in the order of priority.

```js
new WebpackCacheScriptsToLocal({
  name: 'test',
  separator: '-',
  driverName: ['indexedDB', 'webSQL', 'localStorage']
})
```

### chunks

You need cached chunk packages,local caching can be done according to the chunks you pack.

This is default value all chunks

## Author

[Kim](https://github.com/hubvue)
