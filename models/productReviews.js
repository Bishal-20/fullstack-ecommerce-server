const mongoose = require('mongoose');

const productReviewSchema =  mongoose.Schema({
    productId:{
        type:String,
        required:true
    },
    customerName:{
        type:String,
        required:true
    },
    customerId:{
        type:String,
        required:true
    },
    review:{
        type:String,
        required:true,
        default:""
    },
    customerRating:{
        type:Number,
        required:true,
        default:1
    },
    dateCreated:{
        type:Date,
        default:Date.now
    }
})

productReviewSchema.virtual('id').get(function () {

return this._id.toHexString();

});

productReviewSchema.set('toJSON', {

virtuals: true,

});

const productReview = mongoose.model('productReview', productReviewSchema);
module.exports = productReview;