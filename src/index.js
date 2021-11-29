const express = require("express");
const res = require("express/lib/response");
const app = express();
app.use(express.json());
const port = 3000;
const { v4: uuidv4 } = require("uuid");

const custumers = [];
/**
 * cpf - string
 * name - string
 * id- uuid
 * statement - [array]
 */

//Middleware
function verifyIfExistsAccountCPF(req, res, next) {
  const { cpf } = req.headers;

  const customer = custumers.find((customer) => customer.cpf === cpf);
  if (!customer) {
    return res.status(400).json({
      error: "Customer Not Found",
    });
  }
  req.customer = customer;
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  return balance;
}

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;
  const customerAlreadyExists = custumers.some(
    (custumer) => custumer.cpf === cpf
  );
  if (customerAlreadyExists) {
    return res.status(400).json({
      error: "Customer already Exists",
    });
  }
  const id = uuidv4();
  custumers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });
  return res.status(201).send();
});

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;
  const dateFormat = new Date(date + "00:00");
  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );
  return res.json(statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;
  const { customer } = req;
  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };
  customer.statement.push(statementOperation);
  return res.status(201).send();
});

app.post("/whitdraw", verifyIfExistsAccountCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({
      error: "Insufficient funds",
    });
  }
  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "credit",
  };
  customer.statement.push(statementOperation);
  return res.status(201).send();
});

app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = req;
  customer.name = name;
  return res.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { custumers } = req;
  custumers.splice(custumer, 1);
  return res.status(200).json(custumers);
});

app.get("/balance", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const balance = getBalance(custumer.statement);
  return res.json(balance);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
