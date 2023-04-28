let express = require('express');
let router = express.Router();
let cierreProd = require('../models/cierreProd.js');


router.post("/verifyUpdateProd", async (req,res,next) => {
    let rows = await cierreProd.VerifyUpdatesProd(req.body);
    res.json(rows);
})

module.exports = router;