//Connect to database
var mongoose = require("mongoose");
mongoose.connect("mongodb://rahul:password@ds157702.mlab.com:57702/yelpapp");
// mongoose.connect("mongodb://localhost/yelpapp");
// mongodb://<dbuser>:<dbpassword>@ds157702.mlab.com:57702/yelpapp
//other required things
var express=require("express");
var app=express();
var flash=require("connect-flash");
var methodoverride=require("method-override");
var body=require("body-parser");
app.use(body.urlencoded({extend:true}));
var User = require("./models/user");
var passport= require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var seeds=require("./seed.js");
// seeds();


//schema setup
var hotel=require("./models/hotels.js");
var comment=require("./models/comments.js");
app.use(express.static(__dirname+"/public"));
app.use(methodoverride("_method"))
app.use(flash());
//passport congiguration
app.use(require("express-session")({
    secret: "Rusty",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//===============================================
app.use(function(req,res,next){
   res.locals.currentUser=req.user;
   res.locals.error=req.flash("error");
   res.locals.suck=req.flash("suck");
   next();
});
// comment.create({
//     text:"test comment",
//     author:"unknown"
// }
// });
// creating some intial hotels in our database
// hotel.create({
//      name:"sayaji", 
//      image: "https://farm9.staticflickr.com/8442/7962474612_bf2baf67c0.jpg",
//      description:"5 stars good hotel"
// });
// hotel.create({
//     name:"Radison", 
//     image:"https://farm1.staticflickr.com/60/215827008_6489cd30c3.jpg"
// });
//NODEJS
app.get("/",function(req,res){
    
    res.render("landing.ejs");
});
//Index
app.get("/hotels",function(req,res){
    console.log(req.user);
    hotel.find({},function(err,info){
        if(err){console.log("error 404")}
        else{res.render("hotels/hotels.ejs",{info:info})}
    });
    
    // res.render("hotels.ejs",{hotel:hotels});
});
//post request for creating new hotel
app.post("/hotels",logg,function(req,res){
    var hot=req.body.name;
    var image=req.body.imageurl;
    var desc=req.body.description;
    var price=req.body.price;
    var author={
        id:req.user._id,
        username:req.user.username
    };
    var parse={
        name: hot, image: image,description:desc,author:author,price:price
    };
    hotel.create(parse,function(err,ho){
      if(err){console.log(err)} 
      else{console.log("Added")}
    });
    res.redirect("/hotels");
});

app.get("/add",logg,function(req,res){
res.render("hotels/form.ejs"); 
});

app.get("/hotels/:id",function(req,res){
    //get the id
    hotel.findById(req.params.id).populate("comments").exec(function(err,hot){
        if(err){console.log("Error")}
        else{
            console.log(hot);
            
            res.render("hotels/show.ejs",{info:hot});
            console.log(hot.price);
             }
    });
    
});
//=============================================================================
//comments Routes
//==============================================================================
//NEW
app.get("/hotels/:id/comments/new",logg,function(req,res){
    hotel.findById(req.params.id,function(err,hotel){
        if(err){console.log(err)}
        else{
            res.render("comments/new.ejs",{hotel:hotel});
        }
    });
});
//Create
app.post("/hotels/:id/comments",function(req,res){
    hotel.findById(req.params.id,function(err,hotel){
        if(err){console.log(err)}
        else{
            comment.create(req.body.comment,function(err,comment){
                if(err){console.log(err)}
                else{
                    comment.author.id=req.user._id;
                    comment.author.username=req.user.username;
                    comment.save();
                    hotel.comments.push(comment);
                    hotel.save();
                    req.flash("suck","Comment added");
                    res.redirect("/hotels/"+ hotel._id);
                }
            });
        }
    });
});
 //create new comment
 //connect new comment to campground
 //redirect campground show page
 //============================
 //Auth routes
 //============================
 app.get("/register",function(req,res){
     res.render("register.ejs");
 });
app.post("/register",function(req,res){
    User.register(new User({username:req.body.username}),req.body.password,function(err,user){
        if(err){console.log(err)}
        passport.authenticate("local")(req,res,function(){
           res.redirect("/hotels") 
        });
    });
});
app.get("/login",function(req,res){
    res.render("login.ejs");
});
app.post("/login",passport.authenticate("local",{
     successRedirect:"/hotels",
    failureRedirect:"/login"
}),function(req,res){
});
 
app.get("/logout",function(req,res){
    req.logout();
    req.flash("suck","You logged out");
    res.redirect("/");
});
function logg(req,res,next){
       if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","Please login");
    res.redirect("/login");
} 
//=====================
//hotels edit and update
//======================
//Edit
app.get("/hotels/:id/edit",check,function(req,res){
    hotel.findById(req.params.id,function(err,found){
        if(err){console.log(err)}
        else{ res.render("hotels/edit.ejs",{found:found})}
    });
   
});
//Update
app.put("/hotels/:id",check,function(req,res){
    hotel.findByIdAndUpdate(req.params.id,req.body.data,function(err,update){
        if(err){console.log(err)}
        else{
            res.redirect("/hotels/"+ req.params.id);
        }
    });
});
//===================
//Delete hotels
//===================

app.delete("/hotels/:id",check,function(req,res){
    hotel.findByIdAndRemove(req.params.id,function(err){
        if(err){console.log(err)}
        else{
            res.redirect("/hotels");
        }
    });
});
//Authorization middleware
function check(req,res,next){
    if(req.isAuthenticated()){
        hotel.findById(req.params.id,function(err,found){
            if(err){res.redirect("back")}
            else{
                if(found.author.id.equals(req.user._id)){
                    next();
                }
             else{
                  req.flash("error","you are not thte owner");
                 res.redirect("back");
             }
            }
        });
    }
    else{
        req.flash("error","Please login");
        res.redirect("back");
    }
}
//========================
//edit comments
app.get("/hotels/:id/comments/:c_id/edit", checkComments,function(req,res){
    comment.findById(req.params.c_id,function(err,found){
        if(err){console.log(err)}
        else{
             res.render("comments/edit.ejs",{hotelid:req.params.id,comment:found});
        }
    });
   
});
//Update
app.put("/hotels/:id/comments/:c_id", checkComments,function(req,res){
    comment.findByIdAndUpdate(req.params.c_id,req.body.comment,function(err,updated){
        if(err){res.redirect("back")}
        else{
            res.redirect("/hotels/"+req.params.id);
        }
    });
});
//Delete
app.delete("/hotels/:id/comments/:c_id", checkComments,function(req,res){
    comment.findByIdAndRemove(req.params.c_id,function(err){
        if(err){res.redirect("back")}
        else{res.redirect("/hotels/"+req.params.id)}
    });
});
function checkComments(req,res,next){
    if(req.isAuthenticated()){
        comment.findById(req.params.c_id,function(err,found){
            if(err){res.redirect("back")}
            else{
                if(found.author.id.equals(req.user._id)){
                    next();
                }
             else{
                 res.redirect("back");
             }
            }
        });
    }
    else{
        res.redirect("back")
    }
}
 app.listen(process.env.PORT,process.env.IP,function(){
     console.log("server is started");
 });


