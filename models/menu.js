var db=require('../dbconnection');

var menu = {

    getAllmenu:function(callback){

        return db.query("Select * from menu",callback);

    },
    getmenuById:function(id,callback){

        return db.query("select * from menu where idMenu=?",[id],callback);
    },
    addmenu:function(menu,callback){
        console.log("inside service");
        console.log(menu.Id);
        return db.query("INSERT INTO menu (Menu) values(?)",[menu.Menu],callback);
    },
    deletemenu:function(id,callback){
        return db.query("delete from menu where idMenu=?",[id],callback);
    },
    updateMenu:function(id,menu,callback){
        return  db.query("UPDATE menu set Menu=? WHERE idMenu=?",[menu.Menu, id], callback);
    },
    deleteAll:function(item,callback){

        var delarr=[];
        for(i=0;i<item.length;i++){

            delarr[i]=item[i].Id;
        }
        return db.query("delete from geproductos where IDPRODUCTO in (?)",[delarr],callback);
    },
    getUnidades:function(callback){

        return db.query("Select * from geunidad",callback);

    }
};
module.exports=menu;
