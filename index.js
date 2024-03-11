const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_db');
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/employees', async(req, res, next)=> {
  try {
    const SQL = `
      SELECT *
      FROM employees
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  }
  catch(ex){
    next(ex);
  }
});

app.delete('/api/employees/:id', async(req, res, next)=> {
  try {
    const SQL = `
      DELETE FROM employees
      WHERE id = $1
    `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  }
  catch(ex){
    next(ex);
  }
});

app.post('/api/employees', async(req, res, next)=> {
  try {
    const SQL = `
      INSERT INTO employees(name, department_id)
      VALUES($1, $2)
      RETURNING *
    `;
    const response = await client.query(SQL, [req.body.name, req.body.department_id]);
    res.send(response.rows[0]);
  }
  catch(ex){
    next(ex);
  }
});

app.put('/api/employees/:id', async(req, res, next)=> {
  try {
    const SQL = `
      UPDATE employees
      SET name=$1, department_id=$2
      WHERE id = $3
      RETURNING *
    `;
    const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id]);
    res.send(response.rows[0]);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/departments', async(req, res, next)=> {
  try {
    const SQL = `
      SELECT *
      FROM departments
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  }
  catch(ex){
    next(ex);
  }
});


const init = async()=> {
  console.log('connecting to database');
  await client.connect();
  console.log('connected to database');
  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100)
    );
    CREATE TABLE employees(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      department_id INTEGER REFERENCES departments(id) NOT NULL
    );
  `;
  await client.query(SQL);
  console.log('tables created');
  SQL = `
    INSERT INTO departments(name) VALUES('hr');
    INSERT INTO departments(name) VALUES('eng');
    INSERT INTO departments(name) VALUES('fin');
    INSERT INTO employees(name, department_id) VALUES('moe', (SELECT id FROM departments WHERE name='hr'));
    INSERT INTO employees(name, department_id) VALUES('lucy', (SELECT id FROM departments WHERE name='eng'));
    INSERT INTO employees(name, department_id) VALUES('larry', (SELECT id FROM departments WHERE name='eng'));
  `;
  await client.query(SQL);
  console.log('data seeded');

  const port = process.env.PORT || 3000;
  app.listen(port, ()=> {
    console.log(`listening on port ${port}`);
    console.log(`curl localhost:${port}/api/departments`);
    console.log(`curl localhost:${port}/api/employees`);
    console.log(`curl localhost:${port}/api/employees/1 -X DELETE`);
    console.log(`curl localhost:${port}/api/employees -X POST -d '{"name":"ethyl", "department_id": 3}' -H "Content-Type:application/json"`);
    console.log(`curl localhost:${port}/api/employees/2 -X PUT -d '{"name":"update name", "department_id": 3}' -H "Content-Type:application/json"`);
  });
}

init();
