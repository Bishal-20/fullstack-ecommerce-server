const mongoose = require('mongoose');


const cartSchema =mongoose.Schema({

            productTitle: {
                type: String,
                required: true
            },
            images: {
                type: String,
                required: true
            },
            rating:{
            type: String,
            required:true
            },
            price:{
            type: Number,
            required:true
            },
            quantity:{
            type: Number,
            required:true
            },
            subTotal:{
            type: Number,
            required:true
            },
            productId:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            userId:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
})

cartSchema.virtual('id').get(function () {

return this._id.toHexString();

});

cartSchema.set('toJSON', {

virtuals: true,

});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;