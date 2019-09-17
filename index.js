const cheerio = require('cheerio')
const pluginName = 'WebpackCacheScriptsToLocal'
const DRIVER_NAME = {
  localStorage: 'localforage.LOCALSTORAGE',
  indexedDB: 'localforage.INDEXEDDB',
  webSQL: 'localforage.WEBSQL'
}
const DEFAILT_DRIVERNAME =
  '[localforage.INDEXEDDB,localforage.LOCALSTORAGE, localforage.WEBSQL]'

class WebpackCacheScriptsToLocal {
  constructor(options = {}) {
    this.name = options.name ? options.name : 'store'
    this.separator = options.separator ? options.separator : '-'
    this.chunks = options.chunks ? options.chunks : []
    if (!options.driverName) {
      this.driverName = DEFAILT_DRIVERNAME
    } else {
      this.driverName = Array.isArray(options.driverName)
        ? `[${options.driverName.map(driverName => {
          return DRIVER_NAME[driverName]
        })}]`
        : DRIVER_NAME[options.driverName]
    }
  }
  /**
   * compose
   * @param  {...any} fns
   */
  compose(...fns) {
    return fns.reduce((f, g) => (...args) => f(g(...args)))
  }
  /**
   * load localFroage.js
   * @param {*} $
   */
  loadLocalForage($) {
    $('head').append(
      `<script src="https://cdn.staticfile.org/localforage/1.7.3/localforage.min.js"></script>`
    )
  }
  /**
   * sequencing files into key-value map
   * @param {*} scripts
   */
  serializeJs(chunks) {
    const chunkMap = {}
    if (this.chunks.length === 0) {
      this.chunks === Object.keys(chunks)
    }
    Object.keys(chunks).forEach(chunk => {
      if (this.chunks.includes(chunk)) {
        chunkMap[chunk] = chunks[chunk].entry
      }
    })
    return chunkMap
  }
  /**
   * add javascript to html
   * @param {*} html
   */
  appendHtml(html) {
    const $ = cheerio.load(html)
    this.loadLocalForage($)
    return scripts => {
      Object.keys(scripts).forEach(script => {
        $(`[src="${scripts[script]}"]`).remove()
      })
      const firstScript = $('body script')[0]
      if (firstScript) {
        $(firstScript).before(this.jsTemplate(scripts))
      } else {
        $('body').append(this.jsTemplate(scripts))
      }
      return $.html()
    }
  }
  /**
   * javascript template
   * @param {*} scripts
   */
  jsTemplate(scripts) {
    return `<script>
      const store = localforage.createInstance({
        name: "${this.name}"
      })
      store.setDriver(${this.driverName})
      const scriptsMap = ${JSON.stringify(scripts)}
      function loadJS(assets) {
        Object.keys(assets).forEach( async key => {
          try {
              const js = await store.getItem(key)
              if(js === assets[key]) {
                const scripts = await store.getItem(js);
                eval(scripts)
              } else {
                await store.removeItem(js);
                const data = await fetch(assets[key]).then(res => res.text());
                await Promise.all([store.setItem(key, assets[key]),store.setItem(assets[key], data)])
                eval(data)
              }
            } catch(e) {
              console.log('err',e)
            }
          })
      }
      loadJS(scriptsMap)
    </script>`
  }
  /**
   *  webpack plugin necessary method
   * @param {*} compiler
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tap(
        pluginName,
        htmlPluginData => {
          const _html = htmlPluginData.html
          const { chunks } = htmlPluginData.assets
          const appendHead = this.appendHtml(_html)
          const localAssets = this.compose(
            appendHead.bind(this),
            this.serializeJs.bind(this)
          )
          const result = localAssets(chunks)
          htmlPluginData.html = result
        }
      )
    })
  }
}

module.exports = WebpackCacheScriptsToLocal
