let { DataTypes, sequelize } = require("../lib/");
let agent = sequelize.define("agent", {
  agentId: DataTypes.INTEGER,
  name: DataTypes.STRING,
  email: DataTypes.STRING,
});
module.exports = {
  agent,
};
