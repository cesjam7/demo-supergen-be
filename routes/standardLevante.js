var express = require('express');
var router = express.Router();
var standardlevante = require('../models/standardLevante');
const auth = require('../middlewares/auth')

router.get('/:id?', auth.isAuth,async function(req,res,next){

    if(req.params.id > 0){

        standardlevante.getstandardlevanteById(req.params.id,function(err,rows){

            if(err)
            {
                res.json(err);
            }
            else{
                res.json(rows);
            }
        });
    }
    else{
        let rows = await standardlevante.getAllstandard_levante();
        res.json(rows);
    }
});
router.get('/semana/:id', auth.isAuth,function(req,res,next){
    standardlevante.getstandardlevanteByIdSemana(req.params.id,function(err,count){
        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(count);
        }

    });
});
router.post('/', auth.isAuth,async function(req,res,next){
    let r = await standardlevante.addstandardlevante(req.body);
    res.json(req.body);
});
router.post('/:id', auth.isAuth,function(req,res,next){
    standardlevante.deleteAll(req.body,function(err,count){
        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(count);
        }
    });
});
router.delete('/:id', auth.isAuth,function(req,res,next){

    standardlevante.deletestandardlevante(req.params.id,function(err,count){

        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(count);
        }

    });
});
router.put('/:id', auth.isAuth,async function(req,res,next){
    let rows = await standardlevante.updatestandardlevante(req.params.id,req.body);
    res.json(rows);
});
module.exports=router;
