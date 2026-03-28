const mongoose = require('mongoose');


const orderSchema =mongoose.Schema({

    name: {
    type: String,
    required: true
    },
    phoneNumber: {
    type: String,
    required: true
    },
    address: {
    type: String,
    required: true
    },
    pincode: {
    type: String,
    required: true
    },
    amount: {
    type: String,
    required: true
    },
    paymentId: {
    type: String,
    required: true
    },
    email: {
    type: String,
    required: true
    },
    userId: {
    type: String,
    required: true
    },
    products: [
        {
            productId:{
                type:String
            },
            productTitle:{
                type:String
            },
            quantity:{
                type:Number
            },
            price:{
                type:Number
            },
            images:{
                type:String
            },
            subTotal:{
                type:Number
            }

        }
    ],
    status:{
        type:String,
        default:"pending"
    },
    date: {
    type: Date,
    default:Date.now,
    },            
},{timestamps:true})

orderSchema.virtual('id').get(function () {

return this._id.toHexString();

});

orderSchema.set('toJSON', {

virtuals: true,

});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;