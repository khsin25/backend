var mongoose = require('mongoose');
var fs = require("fs");
//var ObjectId = mongoose.Schema.Types.ObjectId;
const ActionTreeSchema = new mongoose.Schema({
  actionTree: Object
})
const ActionTree = mongoose.model('ActionTree', ActionTreeSchema);

exports.ActionTreeSchema_prepopulate = async function(){ //needs work
  var myPromise = new Promise((resolve, reject) => {

    ActionTree.count(function(err, count) {
      if (!err && count === 0) { //empty
        console.log("ActionTree is empty...");
      } else {
        console.log("ActionTree is already filled in the DB, no need to refill")
        resolve(0)
      }
    })
  })
  return myPromise
}

exports.get_ActionTree = async (req, res) => {
    ActionTree.find({}, {'_id': 0, '__v':0}, (err, doc)=>{
      if(err){ throw err; res.status(404).json({error:"not found"}) }
      if(doc){ res.status(200).json(doc[0]); }
    })
}

exports.ActionTree_model = function() {
  return ActionTree
};
