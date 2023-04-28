var express = require('express');
var router = express.Router();
var standardprodhembra = require('../models/standardprodhembra');
const auth = require('../middlewares/auth')

router.get('/:id?', auth.isAuth,async function(req,res,next){

    if(req.params.id > 0){

        standardprodhembra.getstandardprodhembraById(req.params.id,function(err,rows){

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
        let rows = await standardprodhembra.getAllstandard_prod_hembra();
        res.json(rows);
    }
});
router.post('/', auth.isAuth,function(req,res,next){

    standardprodhembra.addstandardprodhembra(req.body,function(err,count){

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
    standardprodhembra.deleteAll(req.body,function(err,count){
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

    standardprodhembra.deletestandardprodhembra(req.params.id,function(err,count){

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

    standardprodhembra.updatestandardprodhembra(req.params.id,req.body,function(err,rows){

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
