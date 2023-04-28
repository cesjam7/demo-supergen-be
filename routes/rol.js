var express = require('express');
var router = express.Router();
var rol = require('../models/rol');
const auth = require('../middlewares/auth')

router.get('/:id?', auth.isAuth,function(req,res,next){

    console.log('todos', req.params)
    if(req.params.id > 0){
        console.log('ruta', req.params.id)
        rol.getrolById(req.params.id,function(err,rows){

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

        rol.getAllrol(function(err,rows){

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

    rol.addrol(req.body,function(err,count){

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
    rol.deleteAll(req.body,function(err,count){
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

    rol.deleterol(req.params.id,function(err,count){

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

    rol.updaterol(req.params.id,req.body,function(err,rows){

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
