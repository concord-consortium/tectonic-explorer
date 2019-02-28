import rollbar from 'rollbar'

export default function initRollbar () {
  const host = window.location.hostname
  const pathname = window.location.pathname
  const branch = pathname.match(/branch\/(.*)\//)
  const version = pathname.match(/version\/(.*)\//)
  // For localhost 127.0.0.* 168.192.* and *.local see http://regexr.com/3dl1e
  const local = host.match(/\blocalhost|\b127\.0\.0|\b192\.168|0\.0\.0\.0|\.local\b/)

  // Guess environment based on the URL.
  // Note that we use S3 deployment that follows some patterns:
  // - production code is deployed to the top-level dir
  // - branches are deployed to /branch/<branch-name> dir
  // - versions are deployed to /version/<version-num> dir
  let env = 'production'
  if (local) {
    env = 'local'
  } else if (branch) {
    env = `branch-${branch[1]}`
  } else if (version) {
    env = `version-${version[1]}`
  }

  if (env === 'local') {
    // Do not enable rollbar for localhost.
    return
  }

  const config = {
    accessToken: 'c30b3ce072cd4c709c9a0e2ee14d6c57',
    captureUncaught: true,
    payload: {
      environment: env,
      host: window.location.host
    }
  }

  rollbar.init(config)
}
