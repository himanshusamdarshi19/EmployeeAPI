let express = require("express");
let { sequelize } = require("./lib/index");
let { agent } = require("./models/agent.model");
let { customer } = require("./models/customer.model");
let { ticket } = require("./models/ticket.model");
let { ticketAgent } = require("./models/ticketAgent.model");
let { ticketCustomer } = require("./models/ticketCustomer.model");

let app = express();
app.use(express.json());

app.get("/seed_db", async (req, res) => {
  await sequelize.sync({ force: true });

  let tickets = await ticket.bulkCreate([
    {
      ticketId: 1,
      title: "Login Issue",
      description: "Cannot login to account",
      status: "open",
      priority: 3,
      customerId: 1,
      agentId: 1,
    },
    {
      ticketId: 2,
      title: "Payment Failure",
      description: "Payment not processed",
      status: "closed",
      priority: 1,
      customerId: 2,
      agentId: 2,
    },
    {
      ticketId: 3,
      title: "Bug Report",
      description: "Found a bug in the system",
      status: "open",
      priority: 2,
      customerId: 1,
      agentId: 1,
    },
  ]);

  let customers = await customer.bulkCreate([
    { customerId: 1, name: "Alice", email: "alice@example.com" },
    { customerId: 2, name: "Bob", email: "bob@example.com" },
  ]);

  let agents = await agent.bulkCreate([
    { agentId: 1, name: "Charlie", email: "charlie@example.com" },
    { agentId: 2, name: "Dave", email: "dave@example.com" },
  ]);

  await ticketCustomer.bulkCreate([
    { ticketId: tickets[0].id, customerId: customers[0].id },
    { ticketId: tickets[2].id, customerId: customers[0].id },
    { ticketId: tickets[1].id, customerId: customers[1].id },
  ]);

  await ticketAgent.bulkCreate([
    { ticketId: tickets[0].id, agentId: agents[0].id },
    { ticketId: tickets[2].id, agentId: agents[0].id },
    { ticketId: tickets[1].id, agentId: agents[1].id },
  ]);

  return res.json({ message: "Database seeded successfully" });
});

// Helper function to get ticket's associated customers
async function getTicketCustomers(ticketId) {
  const ticketCustomers = await ticketCustomer.findAll({
    where: { ticketId },
  });

  let customerData;
  for (let cus of ticketCustomers) {
    customerData = await customer.findOne({
      where: { customerId: cus.customerId },
    });
  }
  return customerData;
}

async function getTicketAgents(ticketId) {
  const ticketAgents = await ticketAgent.findAll({
    where: { ticketId },
  });

  let agentData;
  for (let agnt of ticketAgents) {
    agentData = await agent.findOne({
      where: { agentId: agnt.agentId },
    });
  }
  return agentData;
}

// Helper function to get ticket details with associated customers and agents
async function getTicketDetails(ticketData) {
  const customer = await getTicketCustomers(ticketData.id);
  const agent = await getTicketAgents(ticketData.id);
  return {
    ...ticketData.dataValues,
    customer,
    agent,
  };
}

app.get("/tickets", async (req, res) => {
  try {
    let response = await ticket.findAll();
    // const data = await Promise.all(
    //   response.map((ticket) => getTicketDetails(ticket))
    // );

    const data = [];
    for (const ticket of response) {
      const ticketDetails = await getTicketDetails(ticket);
      data.push(ticketDetails);
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/tickets/details/:id", async (req, res) => {
  try {
    let id = req.params.id;
    let response = await ticket.findAll();
    let result = await getTicketDetails(response[id - 1]);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/tickets/status/:status", async (req, res) => {
  try {
    let status = req.params.status;
    let response = await ticket.findAll();
    let result = response.find((ticket) => ticket.status === status);
    result = await getTicketDetails(result);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.json });
  }
});

async function sortTicketsByPriority(ticket1, ticket2) {
  return ticket1.priority - ticket2.priority;
}

app.get("/tickets/sort-by-priority", async (req, res) => {
  try {
    let response = await ticket.findAll();
    let data = [],
      fdata = [];
    for (const ticket of response) {
      const ticketDetails = await getTicketDetails(ticket);
      data.push(ticketDetails);
    }
    let sortedData = data.sort(
      (ticket1, ticket2) => ticket1.priority - ticket2.priority,
    );
    res.status(200).json(sortedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/tickets/new", async (req, res) => {
  try {
    let newTicket = req.body;
    let addNewData = await ticket.create(newTicket);
    let response = await ticket.findAll();
    await ticketAgent.create({
      ticketId: addNewData.id,
      agentId: newTicket.agentId,
    });
    await ticketCustomer.create({
      ticketId: addNewData.id,
      customerId: newTicket.customerId,
    });
    const data = [];
    for (const ticket of response) {
      const ticketDetails = await getTicketDetails(ticket);
      data.push(ticketDetails);
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function updateTicketDetailById(newTicketData, id) {
  let ticketDetails = await ticket.findOne({ where: { id } });
  if (!ticketDetails) {
    return {};
  }
  ticketDetails.set(newTicketData);
  let updatedTicket = await ticketDetails.save();

  return { ticket: updatedTicket };
}

app.post("/tickets/update/:id", async (req, res) => {
  try {
    let id = req.params.id;
    let data = req.body;
    await updateTicketDetailById(data, id);
    if (data.agentId) {
      await ticketAgent.destroy({ where: { ticketId: id } });
      await ticketAgent.create({ ticketId: id, agentId: data.agentId });
    }
    if (data.customerId) {
      await ticketCustomer.destroy({ where: { ticketId: id } });
      await ticketCustomer.create({
        ticketId: id,
        customerId: data.customerId,
      });
    }
    let response = await ticket.findAll();
    let result = [];
    for (i = 0; i < response.length; i++) {
      const updatedData = await getTicketDetails(response[i]);
      result.push(updatedData);
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function deleteTicketDetails(id) {
  // Delete related rows in the customer and agent tables
  await ticketCustomer.destroy({ where: { ticketId: id } });
  await ticketAgent.destroy({ where: { ticketId: id } });
  let destroyedTicket = await ticket.destroy({ where: { id } });
  if (destroyedTicket === 0) {
    return {};
  }
  return { message: "Ticket with ID " + id + " deleted successfully." };
}

app.post("/ticket/delete", async (req, res) => {
  try {
    let ticketId = req.body.id;
    let response = await deleteTicketDetails(ticketId);
    if (!response.message) {
      return res.status(404).json({ message: "Ticket not found." });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server listening at port 3000");
});
