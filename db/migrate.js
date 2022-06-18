const { migrator } = require('./umzug');

if (require.main === module) {
  migrator.runAsCLI();
}
