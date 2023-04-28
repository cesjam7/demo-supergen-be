/* var express = require('express');
var router = express.Router();
const cpe=require("../models/cpe");
router.post("/find", async (req,res)=>{
  const result=await cpe.find(req.body);
   res.send(result);
});
router.post("/find_in_sunat",async (req,res)=>{
    const result=await cpe.find_in_sunat(req.body);
    res.send(result);
});
router.post("/export",async (req,res)=>{
  const result=await cpe.export(req.body);
  res.send(result);
});
module.exports=router;
 */