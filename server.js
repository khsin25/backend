const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const routes = require('./routes/routes');
const app = express();

mongoose.Promise = global.Promise;
mongoose.connect('mongodb:167.71.122.141');

app.use(bodyParser.json())
// routes(app);


app.use('/', routes);

app.listen(() => console.log('HeartBeat running!'));

