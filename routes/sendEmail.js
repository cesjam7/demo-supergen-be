var express = require('express');
var router = express.Router();
var sendEmail = require('../models/sendEmail');
const auth = require('../middlewares/auth')

router.get('/', auth.isAuth,async function(req,res,next){
    let rows = await sendEmail.getAllResultadosSerologia();
    res.json(rows);
});

module.exports=router;
