module.exports = (config) => {
  const {name, version , description} = require(`${config.interactiveDirName}/package.json`);
  const now = new Date();

  return {
    name,
    version,
    description,
    buildDate: now.toString(),
    buildTimestamp: now.getTime()
  };
};
