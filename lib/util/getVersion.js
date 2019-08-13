const semver = require('semver')
const { loadOptions } = require('../options')

let sessionCached

module.exports = async function getVersions () {
    if (sessionCached) {
      return sessionCached
    }
  
    let latest
    const local = require('vue-cli-version-marker').devDependencies
    // if (process.env.VUE_CLI_TEST || process.env.VUE_CLI_DEBUG) {
    //   return (sessionCached = {
    //     current: local,
    //     latest: local
    //   })
    // }
  
    // should also check for prerelease versions if the current one is a prerelease
    // const includePrerelease = !!semver.prerelease(local)
  
    // const { latestVersion = local, lastChecked = 0 } = loadOptions()
    // const cached = latestVersion
    // const daysPassed = (Date.now() - lastChecked) / (60 * 60 * 1000 * 24)
  
    // if (daysPassed > 1) {
    //   // if we haven't check for a new version in a day, wait for the check
    //   // before proceeding
    //   latest = await getAndCacheLatestVersion(cached, includePrerelease)
    // } else {
    //   // Otherwise, do a check in the background. If the result was updated,
    //   // it will be used for the next 24 hours.
    //   getAndCacheLatestVersion(cached, includePrerelease)
    //   latest = cached
    // }
  
    return (sessionCached = {
      current: local,
      latest
    })
  }
  