var mongoose = require('mongoose');
// var fs = require("fs");
//var ObjectId = mongoose.Schema.Types.ObjectId;
var newMachine = require('./machine.js').get_template_parts

const currentScreenSchema = new mongoose.Schema({
  sn: {type: String, required: true, unique: true},      
  barcode: {type: String, required: true, unique:true}, //TODO: enforce this to be UNIQUE!!!!
  customer: String,
  registerDate: Date,
  operationalHours: {type:Number, required:true},
  installLocation: {
    type: {
      type: String, 
      enum: ['Point'] // 'location.type' must be 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  installAddress: String,
  model: {type: String, required: true}
});