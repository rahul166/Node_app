var mongoose=require("mongoose");
var hotel=require("./models/hotels.js");
var comment=require("./models/comments.js");
var data=[
      {
     name:"sayaji", 
     image: "https://farm9.staticflickr.com/8442/7962474612_bf2baf67c0.jpg",
     description:"5 stars good hotel"
       },
       {
     name:"Radison", 
     image: "https://farm9.staticflickr.com/8442/7962474612_bf2baf67c0.jpg",
     description:"5 stars good hotel"
       }
    ]

function seeds(){
    //removing the hotels
    hotel.remove({},function(err){
        if(err){console.log(err)}
        //add new campgrounds
        data.forEach(function(info){ 
            hotel.create(info,function(err,hot){
             if(err){console.log(err)}
             else{
                 console.log("new hotel");
                 //add new comment
                //  comment.remove({},function(err){
                //      if(err){console.log(err)}
                //      else{console.log("removed")}
                //  });
                 comment.create({
                           text:"blah",
                            author:"unknown"
                    },function(err,comment){
                        if(err){console.log(err)}
                        else{
                            hot.comments.push(comment);
                            hot.save();
                            console.log("comment added");
                        }
                    });
             }});
        
         });
    });
}

module.exports=seeds;