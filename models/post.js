var mongodb = require('./db');
var uuid = require('node-uuid');
var markdown = require('markdown').markdown;


function Post(name,title,post){
    this.name=name;
    this.title=title;
    this.post = post;
}

module.exports = Post;

//存储一片文章以及相关信息
Post.prototype.save = function(callback){
    var date = new Date();
    //存储各种格式，方便以后扩展
    var time = {
        date:date,
        year:date.getFullYear(),
        month:date.getFullYear()+"-"+(date.getMonth()+1),
        day:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(),
        minute:date.getFullYear()+":"+(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())
    }

    //node-uuid
    //https://github.com/broofa/node-uuid
    //// Generate a v1 (time-based) id
    //uuid.v1(); // -> '6c84fb90-12c4-11e1-840d-7b25c5ee775a'
    // Generate a v4 (random) id
    //uuid.v4(); // -> '110ec58a-a0f2-4ac4-8393-c866d813b8d1'
    ////要存入数据的文档
    var post = {
        id:uuid.v1(),
        name:this.name,
        time:time,
        title:this.title,
        post:this.post
    }

    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }

        //读取posts集合
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //将文档插入posts集合
            collection.insert(post,{
                safe:true
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);//失败,返回 err
                }
                callback(null);//返回null为成功
            });
        });
    });
};

//读取文章及其相关信息
Post.get =function(id,callback){
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if(id){
                query.id = id;
            }

            //根据jquery对象查询文章
            collection.find(query).sort({
                time:-1
            }).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);//失败返回 err信息
                }
                //使用markdown 进行转换
                docs.forEach(function(doc){
                    doc.post = markdown.toHTML(doc.post);
                });
                callback(null,docs);//成功!已数组形式返回查询的结果
            });
        });
    });
};

//删除指定文章 
Post.remove=function(id,user,callback){
   
    //打开数据库连接
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            var post = {};
            if(id){
                post.id=id;
                post.name = user.name;
            }
        collection.remove(post,{
                safe:true
            },function(err,result){
               mongodb.close();
               result={};

               if(err){
                 result={
                    success:false,
                    message:err
                 }
                 return callback(result);
              }
            //返回结果
                result.success = true;
               return callback(result);//删除成功
            });
      
        });
    });
};