const mongoose=require("mongoose");

const recentlyViewedProductSchema = mongoose.Schema({
    prodId:{
        type:String,
        default:''
    },
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
    dateCreated: {
        type: Date,
        default: Date.now,
    },
})

recentlyViewedProductSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : undefined;
});

recentlyViewedProductSchema.set('toJSON', {
    virtuals: true,

});

const RecentlyViewedProduct = mongoose.model('RecentlyViewedProduct', recentlyViewedProductSchema);
module.exports=RecentlyViewedProduct;