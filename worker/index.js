const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  // if we lost connection to redis server, try to reconnect in every sec
  retry_strategy: () => 1000 
});

const sub = redisClient.duplicate();

function fib(index) {
    // base case
  if (index === 2) {
    return 1
  } else if (index == 1) {
    return 0
  } else {
    return fib(index - 1) + fib(index - 2);
  }
}

// watch redis for new indicies show up, calcutlate value & store it inside redis
// sub is subscription & anytime we get new message, run this callback func here
// callback func is call with channel & message
sub.on('message', (channel, message) => {
    // calculated fib values will get insert into hash call values
    // message is the index value submitted in the form, fib index value to calculate
  redisClient.hset('values', message, fib(parseInt(message)));
});

// send back to redis instance
sub.subscribe('insert');