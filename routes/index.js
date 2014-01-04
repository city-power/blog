
/*
 * GET home page.
 */
var  crypto = require('crypto'),
        User = require('../models/user.js'),
        Post =require('../models/post.js');

module.exports = function(app){
    app.get('/',function(req,res){
        Post.get(null,function(err,posts){
            if(err){
                posts=[];
            }

            res.render('index',{
                title:'主页',
                user:req.session.user,
                posts:posts,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });
    app.get('/reg',function(req,res){
        res.render('reg',{
            title:'注册',
            user:req.flash('success').toString(),
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
    //post提交
    app.post('/reg',function(req,res){
        var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
        //检验用户两次输入的密码是否一致
        if(password_re != password){
            req.flash('error','两次输入的密码不一致!');
            return res.redirect('/reg');//返回注册页
        }
        //生成密码md5值
        var md5 = crypto.createHash('md5');
                password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name:req.body.name,
            password:password,
            email:req.body.email
        });

        //检查用户名是否已经存在
        User.get(newUser.name,function(err,user){
            if(user){
                req.flash('eror','用户已存在!');
                return res.redirect('/reg');//返回注册页
            }
            //如果不存在则新增用户
            newUser.save(function(err,user){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');//注册失败返回注册页
                }
                req.session.user = user;//用户信息存入session
                req.flash('success','注册成功!');
                res.redirect('/');//注册成功返回首页
            });
      });
  });


    //检查用户登录状态
   app.get('/login',checkNotLogin);
    app.get('/login',function(req,res){
        res.render('login',{
            title:'登陆',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });

    //检查用户登录状态
    app.get('/login',checkNotLogin);
    //post登陆
    app.post('/login',function(req,res){
        //生成密码的md5值
        var md5 = crypto.createHash('md5'),
                password = md5.update(req.body.password).digest('hex');
            User.get(req.body.name,function(err,user){
            if(!user){
                req.flash('error','用户不存在!');
                return res.redirect('/login');//用户名不存在则返回登陆页
            }

            //检查密码是否一致
            if(user.password!=password){
                console.log(user.password+"++++"+password)
                req.flash('error','密码错误!');
                return res.redirect('/login');//密码错误则跳转登陆页
            }

            //用户名密码都匹配后,将用户信息存入session
            req.session.user = user;
            req.flash('success','登陆成功!');
            res.redirect('/');//登陆成功后跳转到主页

        });
    });
   //检查用户登录状态
    app.get('/post',checkLogin);
    app.get('/post',function(req,res){
        res.render('post',{
                title:'发表',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('success').toString()
        });
    });
      //检查用户登录状态
    app.post('/post',checkLogin);
    //post发表
    app.post('/post',function(req,res){
        var currentUser = req.session.user;
             post = new Post(currentUser.name,req.body.title,req.body.post);
             post.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('/');//异常返回首页
            }
            req.flash('success','发布成功!');
            res.redirect('/');//返回首页
        });
    });

    app.post('/remove',checkLogin);
    //删除指定文章
    app.post('/remove',function(req,res){
        var currentUser =req.session.user;
        var id = req.body.id;
         Post.get(id,function(err,post){
             if(err){
                 req.flash('error',err);
                return  res.redirect('/');
            }
            console.log("["+post.length+"]===============");
            if(post.length==0){
                 req.flash('error','该文章不存在!');
                console.log("["+post+"]===============");
                return  res.redirect('/');
            }
            if(currentUser.name!=post[0].name){
                req.flash('error','您没有权限删除改文章!');
                return  res.redirect('/');
            }
            Post.remove(id,currentUser,function(result){
             if(!result.success){
                req.flash('error',result.message);
                return res.redirect('/');//异常返回首页
            }
            req.flash('success','删除成功!');
            res.redirect('/');//返回首页
        });
    });
        
    });

    app.get('/logout',function(req,res){
        req.session.user = null;
        req.flash('success','您已安全退出!');
        res.redirect('/');//退出后跳转到首页
    });
}

//检查用户是否登陆
function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','请登录!');
        res.redirect('/login');//返回之前的页面
    }
    next();
}

function checkNotLogin(req,res,next){
    if(req.session.user){
      //  req.flash('error','已登陆!');
        res.redirect('back');//返回之前的页面
    }
    next();
}