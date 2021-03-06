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
        month:(date.getMonth()+1),
        day:date.getDate(),
        minute:(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes()),
        hour:date.getHours(),
        sec:date.getSeconds()
    }
    //组装
    time.full=time.year+"-"+time.month+"-"+time.day+" "+time.hour+":"+time.minute+":"+time.sec;

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
Post.getAll =function(name,callback){
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
            if(name){
                query.name = name;
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
Post.remove=function(name,day,title,callback){
   
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
            var post = {
                "name":name,
                "time.day":parseInt(day),
                "title":title
            };

        collection.remove(post,{
              w:1
            },function(err){
               mongodb.close();
               if(err){
                 return callback(err);
              }
            //返回结果
                callback(null);//删除成功
            });
      
        });
    });
};


Post.getOne = function(name,day,title,callback){
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(null);
        }
        //读取 posts集合
        db.collection("posts",function(err,connection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            //根据用户名、发表日期以及文章名进行查询
            connection.findOne({
                "name":name,
                "time.day":parseInt(day),
                "title":title
            },function(err,doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                //解析markdown 为html
                if(doc){
                    doc.post = markdown.toHTML(doc.post);
                }
                callback(null,doc);//返回查询的一篇文章
            });
        });
    });
};

//返回原始发表的内容(markdown格式)
Post.edit = function(name,day,title,callback){
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
            //根据用户名、发表日期、文章名进行查询
            collection.findOne({
                "name":name,
                "time.day":parseInt(day),
                "title":title
            },function(err,doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,doc);//返回查询到的文章。
            });
        });
    });
};

//执行更新
Post.update = function(name,day,title,post,callback){
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
            //更新文章内容
            collection.update({
                "name":name,
                "time.day":parseInt(day),
                "title":title
            },{
                $set:{ post:post}
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};