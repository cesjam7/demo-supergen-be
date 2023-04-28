var express = require('express');
var router = express.Router();
var incubadora = require('../models/incubadora');
const auth = require('../middlewares/auth')

router.get('/:id?', auth.isAuth,function(req,res,next){

    if(req.params.id > 0){

        incubadora.getIncubadoraById(req.params.id,function(err,rows){

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

        incubadora.getAllIncubadora(function(err,rows){

            if(err)
            {
                res.json(err);
            }
            else
            {
                res.json(rows);
            }

        });
    }
});
router.post('/', auth.isAuth,function(req,res,next){

    incubadora.addIncubadora(req.body,function(err,count){

        //console.log(req.body);
        if(err)
        {
            res.json(err);
        }
        else{
            res.json(req.body);//or return count for 1 & 0
        }
    });
});
router.post('/:id', auth.isAuth,function(req,res,next){
    incubadora.deleteAll(req.body,function(err,count){
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

    incubadora.deleteIncubadora(req.params.id,function(err,count){

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
router.put('/:id', auth.isAuth,function(req,res,next){

    incubadora.updateIncubadora(req.params.id,req.body,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(rows);
        }
    });
});
module.exports=router;
