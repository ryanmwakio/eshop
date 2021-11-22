const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  products: {
    type: Array,
  },
  user: {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
});

orderSchema.methods.clearOrders = function () {
  this.products = [];
  return this.save();
};

module.exports = mongoose.model("Order", orderSchema);
