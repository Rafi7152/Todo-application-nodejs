const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const date = require("date-fns");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: {e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const validateDetails = (request, response, next) => {
  if (request.method === "GET") {
    let { priority, status, category, date } = request.query;
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    let nextFunction = true;
    if (priority !== undefined) {
      if (priorityArray.includes(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
        nextFunction = false;
      }
    }
    if (status !== undefined) {
      if (statusArray.includes(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
        nextFunction = false;
      }
    }
    if (category !== undefined) {
      if (categoryArray.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
        nextFunction = false;
      }
    }
    if (date !== undefined) {
      const isValidDate = isValid(new Date(date));
      if (isValidDate === true) {
        const newDate = format(new Date(date), "yyyy-MM-dd");
        request.newDate = newDate;
      } else {
        nextFunction = false;
        response.status(400);
        response.send("Invalid Due Date");
      }
    }

    if (nextFunction === true) {
      next();
    }
  } else {
    let { priority, status, category, dueDate } = request.body;
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    let nextFunction = true;
    if (priority !== undefined) {
      if (priorityArray.includes(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
        nextFunction = false;
      }
    }
    if (status !== undefined) {
      if (statusArray.includes(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
        nextFunction = false;
      }
    }
    if (category !== undefined) {
      if (categoryArray.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
        nextFunction = false;
      }
    }
    if (dueDate !== undefined) {
      const isValidDate = isValid(new Date(dueDate));
      if (isValidDate === true) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        request.newDate = newDate;
      } else {
        nextFunction = false;
        response.status(400);
        response.send("Invalid Due Date");
      }
    }

    if (nextFunction === true) {
      next();
    }
  }
};

//const pr = "HIGH";
//const priorityArray = ["HIGH", "MEDIUM", "LOW"];
//const result = priorityArray.includes(pr);
//console.log(result);

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", validateDetails, async (request, response) => {
  const {
    status = "",
    category = "",
    priority = "",
    search_q = "",
  } = request.query;
  const getTodosQuery = `
  SELECT 
    *
  FROM  
    todo
  WHERE 
    status LIKE '%${status}%' AND
    category LIKE '%${category}%' AND
    priority LIKE '%${priority}%'AND
    todo LIKE '%${search_q}%';`;
  const todos = await db.all(getTodosQuery);
  response.send(todos.map(convertDbObjectToResponseObject));
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT 
    *
  FROM 
    todo
  WHERE 
    id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(todo));
});

app.get("/agenda/", validateDetails, async (request, response) => {
  let { newDate } = request;
  const getDateTodos = `
    SELECT 
      *
    FROM 
      todo
    WHERE 
      due_date = "${newDate}";`;
  const todos = await db.all(getDateTodos);
  response.send(todos.map(convertDbObjectToResponseObject));
});

app.post("/todos/", validateDetails, async (request, response) => {
  const { id, todo, priority, category, status, dueDate } = request.body;
  const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
  const addTodoQuery = `
    INSERT INTO 
      todo(id,todo,priority,category,status,due_date)
    VALUES(${id},'${todo}','${priority}','${category}','${status}','${newDueDate}');`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", validateDetails, async (request, response) => {
  const { todoId } = request.params;
  const getPreviousTodoQuery = `
    SELECT
      *
    FROM 
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(getPreviousTodoQuery);
  let {
    id = previousTodo.id,
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    category = previousTodo.category,
    status = previousTodo.status,
    dueDate = previousTodo.due_date,
  } = request.body;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const updateTodoQuery = `
  UPDATE 
    todo
  SET 
    todo = '${todo}',
    priority = '${priority}',
    category = '${category}',
    status = '${status}',
    due_date = '${dueDate}';`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE
    FROM 
      todo
    WHERE 
      id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
