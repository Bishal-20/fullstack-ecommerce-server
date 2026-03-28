const mongoose=require("mongoose");

const productSchema = mongoose.Schema({

    name: { 
     type: String,
     required: true,
    },

    description: {
        type: String,
        required: true
    },

    images: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ImageUpload"
    },

    brand: {
        type: String,
        default:''
    },
    
    price: {
        type: Number,
        default: 0
    },

    oldPrice:{
        type: Number,
        default:0
    },
    
    category:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    subCat:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true,
    },      
     countInStock: {
        type: Number,
        required: true,
    },
    
    rating: {
    type: Number,
     default: 0,
    },

    isFeatured: {
        type: Boolean,
        default: false,
    },
    discount:{
        type:Number,
        required:true
    },
    productWeight: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProductWeight',
          required: true
        }
    ],
    location:{
        type: [String],
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
})

productSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : undefined;
});

productSchema.set('toJSON', {
    virtuals: true,

});

const Product = mongoose.model('Product', productSchema);
module.exports=Product;