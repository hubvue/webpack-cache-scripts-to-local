const cheerio = require('cheerio')
const pluginName = 'WebpackCacheScriptsToLocal'
const DRIVER_NAME = {
  store: 'localforage.LOCALSTORAGE',
  indexedDB: 'localforage.INDEXEDDB',
  WebSQL: 'localforage.WEBSQL'
}
const DEFAILT_DRIVERNAME =
  '[localforage.INDEXEDDB,localforage.LOCALSTORAGE, localforage.WEBSQL]'

class WebpackCacheScriptsToLocal {
  constructor(options = {}) {
    this.name = options.name ? options.name : 'store'
    this.separator = options.separator ? options.separator : '-'
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
  serializeJs(scripts) {
    const jsMap = {}
    scripts.forEach(js => {
      const [name] = js.split(this.separator)
      jsMap[name] = js
    })
    return jsMap
  }
  /**
   * add javascript to html
   * @param {*} html
   */
  appendHtml(html) {
    const $ = cheerio.load(html)
    $('script').remove()
    this.loadLocalForage($)
    return scripts => {
      $('head').append(this.jsTemplate(scripts))
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
      async function loadJS(assets) {
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
          const { js: scripts } = htmlPluginData.assets
          const appendHead = this.appendHtml(_html)
          const localAssets = this.compose(
            appendHead.bind(this),
            this.serializeJs.bind(this)
          )
          const result = localAssets(scripts)
          htmlPluginData.html = result
        }
      )
    })
  }
}

module.exports = WebpackCacheScriptsToLocal
