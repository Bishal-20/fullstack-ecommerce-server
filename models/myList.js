const mongoose = require('mongoose');


const myListSchema =mongoose.Schema({

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

    myListSchema.virtual('id').get(function () {
    return this._id.toHexString();
    });

    myListSchema.set('toJSON', {
    virtuals: true,
    });

const MyList = mongoose.model('MyList', myListSchema);
module.exports = MyList;