let { DataTypes, sequelize } = require("../lib/");
let { agent } = require("./agent.model");
let { ticket } = require("./ticket.model");
let ticketAgent = sequelize.define("ticketAgent", {
  ticketId: {
    type: DataTypes.INTEGER,
    references: {
      model: ticket,
      key: "id",
    },
  },
  agentId: {
    type: DataTypes.INTEGER,
    references: {
      model: agent,
      key: "id",
    },
  },
});

ticket.belongsToMany(agent, { through: ticketAgent });
agent.belongsToMany(ticket, { through: ticketAgent });

module.exports = {
  ticketAgent,
};
