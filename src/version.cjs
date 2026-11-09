function getVersion() {
  const pkg = require("../package.json");

  return pkg.version;
}

module.exports = getVersion;
