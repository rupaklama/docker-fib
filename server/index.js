const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// react app to express
app.use(cors());
// turn incoming request from the react app into json data
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
// anytime error occurs
// creating table
pgClient.on('connect', () => {
  pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch((err) => console.log(err));
});

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  // try to reconnect redis once in every second
  retry_strategy: () => 1000
});

// making dupicate connections on both files to connect to redis server
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
  res.send('Hi');
});

// query data from postgresdb
app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values');

  res.send(values.rows);
});

// query store data from redis
// redis lib for node does not have promise support, using callbacks instead of await
app.get('/values/current', async (req, res) => {
    // get all the data from hash call values
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

// new value from react app
app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }
  // storing into redis
  redisClient.hset('values', index, 'Nothing yet!');
  // pulling & calculating new values
  redisPublisher.publish('insert', index);
  // saving in postgresdb
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
  // calculating fib value
  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Server listening at port 5000!');
})