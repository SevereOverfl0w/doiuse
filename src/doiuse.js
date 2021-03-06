let _ = require('lodash')
let missingSupport = require('./missing-support')
let Detector = require('./detect-feature-use')

function doiuse (options) {
  let browserQuery = options.browsers
  let onFeatureUsage = options.onFeatureUsage
  let ignore = options.ignore

  if (!browserQuery) {
    browserQuery = doiuse['default'].slice()
  }
  let {browsers, features} = missingSupport(browserQuery)
  let detector = new Detector(_.keys(features))

  return {
    info () {
      return {
        browsers: browsers,
        features: features
      }
    },

    postcss (css, result) {
      return detector.process(css, function ({feature, usage}) {
        if (ignore && ignore.indexOf(feature) !== -1) {
          return
        }

        let message = features[feature].title + ' not supported by: ' +
          features[feature].missing + ' (' + feature + ')'

        result.warn(message, { node: usage, plugin: 'doiuse' })

        if (onFeatureUsage) {
          let loc = usage.source
          loc.original = css.source.input.map ? {
            start: css.source.input.map.consumer().originalPositionFor(loc.start),
            end: css.source.input.map.consumer().originalPositionFor(loc.end)
          } : {
            start: loc.start,
            end: loc.end
          }

          message = (loc.original.start.source || loc.input.file || loc.input.from) + ':' +
            loc.original.start.line + ':' + loc.original.start.column + ': ' + message

          onFeatureUsage({
            feature: feature,
            featureData: features[feature],
            usage: usage,
            message: message
          })
        }
      })
    }
  }
}
doiuse['default'] = [
  '> 1%',
  'last 2 versions',
  'Firefox ESR',
  'Opera 12.1'
]
module.exports = doiuse
