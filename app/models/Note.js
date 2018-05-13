var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
// This is similar to a Sequelize model
var NoteSchema = new Schema({

  body: {
    type: String,
    required: true
  },

  updated: {
    type: Date,
    default: Date.now(),
    required: true
  },

  username: {
    type: String,
    required: true
  },
  
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

// This creates our model from the above schema, using mongoose's model method
var Note = mongoose.model("Note", NoteSchema);

// Export the Note model
module.exports = Note;