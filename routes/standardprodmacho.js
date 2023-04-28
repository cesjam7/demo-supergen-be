var express = require('express');
var router = express.Router();
var standardprodmacho = require('../models/standardprodmacho');
const auth = require('../middlewares/auth')

router.get('/:id?', auth.isAuth,async function(req,res,next){

    if(req.params.id > 0){

        standardprodmacho.getstandardprodmachoById(req.params.id,function(err,rows){

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
        let rows = await standardprodmacho.getAllstandard_prod_macho();
        res.json(rows);
    }
});
router.post('/', auth.isAuth,function(req,res,next){

    standardprodmacho.addstandardprodmacho(req.body,function(err,count){

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
    standardprodmacho.deleteAll(req.body,function(err,count){
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

    standardprodmacho.deletestandardprodmacho(req.params.id,function(err,count){

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

    standardprodmacho.updatestandardprodmacho(req.params.id,req.body,function(err,rows){

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
