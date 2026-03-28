const express = require("express");
const MyList = require("../models/myList");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const myList = await MyList.find(req.query);
    if(!myList){
      return  res.status(500).json({ success: false});
    }

    return res.status(200).json(myList);

    }catch(error){
        res.status(500).json({success:false})
    }
});

router.get('/:id' , async(req,res)=>{
  const item = await MyList.findById(req.params.id);

  if(!item){
    return res.status(500).json({message:"The item was not found"});

  }
  return res.status(200).send(item);
})

router.post("/add" , async(req,res)=>{
  const item = await MyList.findOne({
  productId: req.body.productId,
  userId: req.body.userId
});
    if(!item){
      let list = new MyList({
        productTitle: req.body.productTitle,
        images: req.body.images,
        rating: req.body.rating,
        price: req.body.price,
        productId: req.body.productId,
        userId: req.body.userId
    })

    if(!list){
        res.status(500).json({
            error: err,
            sucess:false
        })
    }

    list= await list.save();
    res.status(200).json(list);
  }else{
    res.status(409).json({status:false , msg:"Product already in Whislist"})  }

})

router.delete("/:id", async (req, res) => {
  try {
    const item = await MyList.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: " Item not found" });
    }

    // Finally delete the cart item
    await MyList.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Item deleted successfully" });

  } catch (err) {
    console.error("DELETE  ITEM ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
