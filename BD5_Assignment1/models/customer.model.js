let { DataTypes, sequelize } = require("../lib/");
let customer = sequelize.define("customer", {
  customerId: DataTypes.INTEGER,
  name: DataTypes.STRING,
  email: DataTypes.STRING,
});
module.exports = {
  customer,
};
