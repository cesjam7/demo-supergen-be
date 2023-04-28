var express = require('express');
var router = express.Router();
var Aviagen = require('../models/Aviagen');
const auth = require('../middlewares/auth')

router.post("/LOP", auth.isAuth, async function(req, res, next) {
    let rows
    if(req.body.Tipo == 'Levante'){
        rows = await Aviagen.LOP_L(req.body);
    }else{
        rows = await Aviagen.LOP_P(req.body);
    }
    res.json(rows);
})

router.post("/ExportExcel", auth.isAuth, async function(req, res, next) {
    let rows = await Aviagen.ExportExcel(req.body);
    res.json(rows);
})

module.exports = router;