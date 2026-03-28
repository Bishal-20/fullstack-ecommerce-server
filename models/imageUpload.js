const mongoose = require('mongoose');

const imageUploadSchema = mongoose.Schema({
    images:[
           {
            url: { type: String, required: true },
            public_id: { type: String, required: true }
            }
    ]
})

imageUploadSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

imageUploadSchema.set('toJSON', {
    virtuals: true,

});

module.exports= mongoose.model('ImageUpload', imageUploadSchema);