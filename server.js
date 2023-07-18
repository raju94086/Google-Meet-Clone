const express=require("express")
const path=require("path")
const { Socket } = require("socket.io")
var app=express()
var server=app.listen(3000, function(){
    console.log("listening on port 3000")})
const fs=require("fs");
const fileUpload=require("express-fileupload")
const io=require("socket.io")(server,{
    allowEIO3: true // false by default
  });
;
app.use( express.static(path.join(__dirname,"")))
var userConnections=[]
io.on("connection", (socket)=>{
    console.log("socket id is ", socket.id)
    socket.on("userconnect", (data)=>{
        console.log("userconnect", data.displayName, data.meetingid)
        var other_users=userConnections.filter((p)=>p.meeting_id==data.meetingid)
        userConnections.push({
            connectionId:socket.id,
            user_id: data.displayName,
            meeting_id:data.meetingid,
        })
        var  userCount=userConnections.length  ;
        console.log(userCount)
        other_users.forEach((v)=>{
            socket.to(v.connectionId).emit("inform_others_about_me",{
                other_users_id:data.displayName,
                connId:socket.id,
                userNumber: userCount
            } )
        })
        socket.emit("inform_me_about_other_user", other_users);
    }) 
    socket.on("SDPProcess", (data)=>{
        socket.to(data.to_connid).emit("SDPProcess", {
            message:data.message,
            from_connid: socket.id,

        })

    })
    socket.on("sendMessage",(msg)=>{
        console.log(msg);
        var mUser=userConnections.find((p)=>p.connectionId==socket.id);
        if(mUser){
            var  meetingid=mUser.meeting_id;
            var from=mUser.user_id;
            var list=userConnections.filter((p)=>p.meeting_id==meetingid);
            list.forEach((v)=>{
                socket.io(v.connectionId).emit("showChatMessage", {
                    from:from,
                    message:msg
                })
            })
        }
    }) 
    socket.on("disconnect", function(){
        console.log("User got disconnected")
        var disUser= userConnections.find((p)=>p.connectionId==socket.id);
        if (disUser){
            var meetingid=disUser.meeting_id;
            userConnections=userConnections.filter((p)=>p.connectionId != socket.id)
            var list=userConnections.filter((P)=>P.meeting_id==meetingid)
        list.forEach((v)=>{
            var usernumberafterUserLeave = userConnections.length;
            socket.to(v.connectionId).emit("inform_other_about_disconnected_user",{
                connId:Socket.id,
                uNumber:usernumberafterUserLeave
            })
        })
        }
    })


    socket.on("disconnect", function(){
        console.log("Disconnected");
       var disUser= userConnections.find((p)=>p.connectionId==socket.id);
       if(disUser){
        var meetingid=disUser.meeting_id;
        userConnections=userConnections.filter((p)=>p.connectionId!=socket.id);
        var list=userConnections.filter((p)=>p.meeting_id==meetingid)
        list.forEach((v)=>{
            socket.to(v.connectionId).emit("inform_about_connection_end", {
                connId:socket.id
            })
        })
       }
    })
})
app.use(fileUpload());  
app.post("/attaching", function(req, res){
    var data=req.body;
    var imageFile= req.files.zipfile;
    console.log(imageFile);
    var dir="public/attachment/"+data.meeting_id+"/";
    if(!fs.existSync(dir)){
        fs.mkdirSync(dir);
    }
    imageFile.mimetype(
        "public/attachment"
    )
})
