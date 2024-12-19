let { DataTypes, sequelize } = require("../lib/");
let { customer } = require("./customer.model");
let { ticket } = require("./ticket.model");
let ticketCustomer = sequelize.define("ticketCustomer", {
  ticketId: {
    type: DataTypes.INTEGER,
    references: {
      model: ticket,
      key: "id",
    },
  },
  customerId: {
    type: DataTypes.INTEGER,
    references: {
      model: customer,
      key: "id",
    },
  },
});

ticket.belongsToMany(customer, { through: ticketCustomer });
customer.belongsToMany(ticket, { through: ticketCustomer });

module.exports = {
  ticketCustomer,
};
