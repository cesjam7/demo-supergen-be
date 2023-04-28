var express = require('express');
var router = express.Router();
var levantePeso = require('../models/levantePeso');
const auth = require('../middlewares/auth')
var mortalidad1 = require('../models/mortalidad');

router.get('/ultimo-dia/:id?', auth.isAuth,function(req,res,next){
    levantePeso.getPesoUltimoDia(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/dia/:idlevante/:edad', auth.isAuth,function(req,res,next){
    console.log('params', req.params);
    levantePeso.getmortalidadDia(req.params.idlevante, req.params.edad,function(err,rows){
        
        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.post('/semana/', auth.isAuth,async function(req,res,next){
    let rows = await levantePeso.getPesoSemana(req.body);
    res.json(rows);
})
router.post('/semana/grupal/', auth.isAuth,async function(req,res,next){
let rows = await levantePeso.getNroSemana_xLevante(req.body);
res.json(rows);
})
 router.get('/lineas/:id?', auth.isAuth,function(req,res,next){
    levantePeso.getPesoLineas(req.params.id,function(err,rows){

         if(err)
         {
             res.json(err);
         }
         else{
             res.json(rows);
         }
     });
 })
router.get('/levantes/', auth.isAuth,function(req,res,next){
    levantePeso.getPesoLevantes(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/levante/:id?', auth.isAuth,async function(req,res,next){
    let rows = await levantePeso.getMortalidadLevante(req.params.id);
    res.json(rows);
})
router.get('/levantepesos/:id?', auth.isAuth,async function(req,res,next){
    let rows = await levantePeso.getPesosUniformidad(req.params.id)
    res.json(rows);
})
router.get('/levantepesos/:id?', auth.isAuth,function(req,res,next){
    levantePeso.getPesoLevantes2(req.params.id,function(err,rows){

         if(err)
         {
             res.json(err);
         }
         else{
             res.json(rows);
         }
     });
})
router.get('/levantepesos/lineas/:idLinea', auth.isAuth,function(req,res,next){
levantePeso.getPesosUniformidadLineas(req.params.idLinea, function(err,rows){
    console.log('-----> idlinea ', req.params.idLinea);
        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/mortalidades/:id?', auth.isAuth,function(req,res,next){
    levantePeso.getMortalidadByIdLevante(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);

        }
        else{
            res.json(rows);
        }
    });
})
//nuevo---------------------------------------------------
router.get('/pesojson/:id?', auth.isAuth,function(req,res,next){
    levantePeso.getPesoJsonByIdLevante(req.params.id,function(err,rows){

         if(err)
         {
             res.json(err);
         }
         else{
             res.json(rows);
         }
     });
})
//nuevo---------------------------------------------------
router.get('/dias/:id?', auth.isAuth,function(req,res,next){
    levantePeso.getmortalidadDia(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/stdPeso/:idLevante/:id/:semana', auth.isAuth,function(req,res,next){
    levantePeso.getPesoSTD(req.params.idLevante,req.params.id,req.params.semana,function(err,rows){

         if(err)
         {
             res.json(err);
         }
         else{
             res.json(rows);
         }
     });
})
router.get('/edad-maximo/', auth.isAuth,function(req,res,next){
    levantePeso.getEdadMaximo(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/edad/:id?', auth.isAuth,function(req,res,next){
    levantePeso.getEdadEspecifica(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/dia-inicio/', auth.isAuth,function(req,res,next){
    levantePeso.getDiaInicio(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/:id?', auth.isAuth,function(req,res,next){

    if(req.params.id > 0){

        levantePeso.getmortalidadById(req.params.id,function(err,rows){

            if(err)
            {
                res.json(err);
            }
            else{
                res.json(rows);
            }
        });
    }else{

        levantePeso.getAllmortalidad(function(err,rows){

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
    levantePeso.addMortalidad(req.body,function(err,count){

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
router.post('/modal/', auth.isAuth,async function(req,res,next){
    req.body.Semana = req.body.semana;
    let count = await mortalidad1.verifyMortalidad(req.body);
    if(count.length == 0){
        res.json({
            "message":"Primero registre Datos en Mortalidad",
            "success": false
        })
    }else{
        levantePeso.addPesoModal(req.body,function(err,rows){
            if(err){
                res.json(err);
            }else{                        
                levantePeso.addPesoModal2(req.body,function(err,rows){
                    if(err){
                        res.json(err);
                    }else{
                        levantePeso.addPesoModal3(req.body,function(err,rows){
                            if(err){
                                res.json(err);
                            }else{
                                res.json(rows);
                            }
                        });
                    }
                });
            }
        });
    }
});
router.post('/:id', auth.isAuth,function(req,res,next){
    levantePeso.deleteAll(req.body,function(err,count){
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

    levantePeso.deletemortalidad(req.params.id,function(err,count){

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

    levantePeso.updateMortalidad(req.params.id,req.body,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else
        {
            levantePeso.updateMortalidad2(req.params.id,req.body,function(err,rows){

                if(err)
                {
                    res.json(err);
                }
                else
                {
                    levantePeso.addPesoModal3(req.body,function(err,rows){

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
        }
    });
});
module.exports=router;
