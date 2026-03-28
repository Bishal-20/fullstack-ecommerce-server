const productReview = require('../models/productReviews');
const express = require('express');
const router = express.Router();

router.get('/' , async(req ,res)=>{
    let reviews =[];

    try{
        if(req.query.productId!==undefined && req.query.productId!==null && req.query.productId!==""){
            reviews = await productReview.find({productId:req.query.productId});
        }else{
            reviews= await productReview.find();
        }

        if(!reviews){
            res.status(500).json({success:false})
        }

        return res.status(200).json(reviews);
    }catch(error){
        res.status(500).json({success:false})
    }
});

router.get('/:id' , async(req,res)=>{
    const review = await productReview.findById(req.params.id);
    if(!review){
        res.status(500).json({message:"The review with the given Id was not found"})
    }
    return res.status(200).send(review);
})

router.post('/add' , async(req, res)=>{
    try{
        let review = new productReview({
            customerId:req.body.customerId,
            customerName:req.body.customerName,
            review:req.body.review,
            customerRating:req.body.customerRating,
            productId:req.body.productId
        });

        if(!review){
            return res.status(500).json({
                error:err,
                success:false
            })
        }

        review= await review.save();

        res.status(201).json(review);
    }catch(error){
        res.status(500).json({
            error:error,
            success:false
        })
    }
});

module.exports=router;