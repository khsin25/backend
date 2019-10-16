var mongoose = require('mongoose');
// var fs = require("fs");
// var ObjectId = mongoose.Schema.Types.ObjectId;
var machine = require('./machine.js')
var user = require('./user.js')
// var Machine = machine.Machine_model()
// var User = user.User_model()
// var check = require('../passport/middleware.js').hasPermission

const ReportingSchema = new mongoose.Schema({
  reportType: {type:String},
  reportedBy: {type:String},
  reportDate: {type:Date, default: Date.now},
  report: {type:Object}
});
const Reporting = mongoose.model('Reporting', ReportingSchema);

exports.Reporting_model = function() {
  return Reporting
};