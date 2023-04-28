var express = require('express');
var router = express.Router();
var lineas = require('../models/lineas');
const auth = require('../middlewares/auth')

router.get('/:id?', auth.isAuth, async (req,res)=>{
    if(req.params.id > 0){

        lineas.getLineaById(req.params.id,function(err,rows){

            if(err)
            {
                res.json(err);
            }
            else{
                res.json(rows);
            }
        });
    }else{
        let rows = await lineas.getAllLineas();
        res.json(rows);
    }
});
router.post('/', auth.isAuth, auth.isAuth,function(req,res,next){

    lineas.addLinea(req.body,function(err,count){

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
router.post('/:id', auth.isAuth, auth.isAuth,function(req,res,next){
    lineas.deleteAll(req.body,function(err,count){
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
router.delete('/:id', auth.isAuth, auth.isAuth,function(req,res,next){

    lineas.deleteLinea(req.params.id,function(err,count){

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
router.put('/:id', auth.isAuth, auth.isAuth,function(req,res,next){

    lineas.updateLinea(req.params.id,req.body,function(err,rows){

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
