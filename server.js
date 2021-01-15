const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
var multer  = require('multer');
var path = require('path');
const socketio = require('socket.io');
const port = process.env.PORT || 3001;
const app = express();
app.use(express.json());
const mongoose = require('mongoose');
cors = require('cors');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const { MONGOURI } = require('./config/keys');
var User2=require('./addAlumini');
var User = require('./signin');
var Chat = require('./chat');
var User4 = require('./calendar');
var Image = require('./uploadImage');

let email;let name;
//app.use('/static', express.static(path.join(__dirname, 'public')))
//app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept,Authorization"
  );
  res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
  next();
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now()+file.originalname)
    }
  });

  const fileFilter=(req, file, cb)=>{
   if(file.mimetype ==='image/jpeg' || file.mimetype ==='image/jpg' || file.mimetype ==='image/png'){
       cb(null,true);
   }else{
       cb(null, false);
   }

  }

var upload = multer({ 
    storage:storage,
    limits:{
        fileSize: 1024 * 1024 * 5
    },
    fileFilter:fileFilter
 });




const server = http.createServer(app);
const io = socketio(server);

app.get('/getImage',(req,res)=>{
    Image.find({},(err,data)=>{
        if(err)
        return res.json(
            'error:server error'
        );
            return res.json({
            message:'success',
            values:data
        })
    })
})

app.post('/fetchStamp',(req,res)=>{
    let body='';
    req.on('data',chunk=>{
        body+=chunk.toString();
        const obj=JSON.parse(body);
        const {email,emailCredentials}=obj;
          Chat.find({
            "$or":[{toEmail:email,fromEmail:emailCredentials},{toEmail:emailCredentials,fromEmail:email}]
          },(err,previous)=>{
            res.json(previous);
          });
    })
})
app.post('/uploadImage',upload.single("profileImage"),(req,res)=>{
    let body='';

    var profilePic=req.valueOf().file.path;
    var email=req.body.email;

    Image.find({email:email},(err,preValue)=>{

        if(preValue.length>0)
         for(let i=0;i<preValue.length;i++){
          preValue[i].deleteOne({email:email});
          if(!preValue[i].image.length)
            preValue[i].deleteOne({email:email});
         }
        const newUser=new Image();
        newUser.image=profilePic;
        newUser.email=email;
        newUser.save()
        .then(doc=>{

            if(doc.image.length)
            res.status(201).json({
                message:"Profile Image uploaded successfully",
                results:doc
            })
        })
        .catch(err=>{
            res.json(err);
        })

    })
})

app.get('/fetchUsers',(req,res)=>{
  

    User2.find({},(err,users)=>{
        if(err)
        return res.json(
            'error:server error'
        )

        return res.json({
            message:'success',
            values:users
        })
    })
})
app.post('/signin', (req, res) => {

    let body = ''
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string

        const obj = JSON.parse(body)
        const { password } = obj;

        let { email } = obj;

        if (!password) {
            return res.json(
                "error:password cannot be blank"
            )
        }

        if (!email) {
            return res.json(
                'error:email cannot be blank'
            )
        }

        email = email.toLowerCase();
        User2.find({
                email: email
            }, (err, users) => {
                if (err) {
                    return res.json(
                        'error:server error'
                    )
                }
                 
                if (users.length != 1) {
                    return res.json(
                        'error:Invalid user'
                    )
                }

                const user = users[0];

                if (!user.comparePassword(password)) {
                    return res.json(
                        "password doesn't matched"
                    )
                }


                    return res.json({
                        message: 'success',
                        email: email,
                        userName:user.userName
                    })
                

            })
            .catch(err => console.log('errorr'))


    })
     
})

app.post('/admin',(req,res)=>{
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
    const obj = JSON.parse(body);

    const {firstName,lastName,password,userName,field,company,phone,placementYear}=obj;
    let {email}=obj;
    email=email.toLowerCase();
    if(!password){
        return res.json(
            "error:password cannot be blank"
        )
    }

    if(!email){
        return res.json(
            'error:email cannot be blank'
        )
    }
     User2.find({
        email:email
     },
     (err,previousUser)=>{
        if(err){
            return res.json(
                'error1:server error'
            )
        }
        

         if(previousUser.length>0){
            return res.json(
                'error2:user already exists '
            )
        }
        
        const newUser=new User2();
        newUser.email=email;
        newUser.password=newUser.generateHash(password);
        newUser.firstName=firstName;
        newUser.lastName=lastName;
        newUser.userName=userName;
        newUser.field=field;
        newUser.company=company;
        newUser.phone=phone;
        newUser.placementYear=placementYear;

        newUser.save((err,user)=>{
            if(err){
             return res.json(
                'error3:server error'
             )
            }
       
           return res.json({
            message:'success',
            email:email
            })
        })

    })
     .catch(err => console.log('errorr')) 
})
})


app.post('/deleteUser',(req,res)=>{

    let body = ''
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string

        const obj = JSON.parse(body)
    

    const {email,array}=obj;

      Chat.find({
        "$or":[{toEmail:email},{fromEmail:email}]
      },(err,previous)=>{
        for(let i=0;i<previous.length;i++)
            previous[i].deleteOne({_id:previous[i]._id});
      }); 
      User4.find({
        email:email
      },(err,previous)=>{
        for(let i=0;i<previous.length;i++)
            previous[i].deleteOne({_id:previous[i]._id});
      }); 
      User.find({
        email:email
      },(err,previous)=>{
        for(let i=0;i<previous.length;i++)
            previous[i].deleteOne({_id:previous[i]._id});
      }); 
      Image.find({
        email:email
      },(err,previous)=>{
        for(let i=0;i<previous.length;i++)
            previous[i].deleteOne({_id:previous[i]._id});
      }); 
      res.json('success');  

  })
})


app.post('/messaging',(req,res)=>{

    let body = ''
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string

        const obj = JSON.parse(body)
    

    const {emailCredentials}=obj;
    const {email}=obj;
      Chat.find({
        "$or":[{toEmail:email,fromEmail:emailCredentials},{toEmail:emailCredentials,fromEmail:email}]
      },(err,previous)=>{
        res.json(previous);
      });   

  })
})

app.post('/newmessage',(req,res)=>{

    let body = ''
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string

        const obj = JSON.parse(body)
    

    const {emailCredentials}=obj;
    const {email}=obj;
    const {messageLength}=obj;


      Chat.find({
        "$or":[{toEmail:email,fromEmail:emailCredentials},{toEmail:emailCredentials,fromEmail:email}]
      },(err,previous)=>{
        if(messageLength!==previous.length)
        res.json(previous);
      });   

  })
})


app.post('/fetchCalendar',(req,res)=>{

    let body = ''
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string

        const obj = JSON.parse(body);

        const {id,email,title,startDate,endDate,backgroundColor}=obj;

        User4.find({
            email:email
        },(err,previous)=>{
                
                const newCalendar=new User4();
                newCalendar.email=email;
                newCalendar.title=title;
                newCalendar.startDate=startDate;
                newCalendar.endDate=endDate;
                newCalendar.backgroundColor=backgroundColor;
                newCalendar.save((err,event)=>{
                    if(err){
                        res.json('error:server error')
                    }

                    res.json("success");
                })
            
        })
    })   
})

app.post('/fetchEvents',(req,res)=>{

    let body = ''
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string

        const obj = JSON.parse(body);
        const {email}=obj;

        User4.find({
            email:email
        },(err,previous)=>{
           res.json(previous);

        })
        .catch(err=>console.log(err))
    })   

})

app.post('/update',(req,res)=>{

    Calendar.find({
        _id:req.body.sessionId
    },(err,prev)=>{
        if(err){
            console.log(err)
        }
    if(prev[0].length){
      prev[0].title=req.body.title;
      prev[0].email=req.body.email;
      prev[0].startDate=req.body.startDate;

      prev[0].endDate=req.body.endDate;

      prev[0]._id=req.body.sessionId
      prev[0].backgroundColor=req.body.backgroundColor;

            prev[0].save((err,event)=>{
                if(err)
                 res.json('error: server error');

                res.json('successfully updated')
            });
           }
   })



})

app.post('/resize',(req,res)=>{
    Calendar.find({
        _id:req.body.sessionId
    },(err,prev)=>{
        if(err){
            console.log(err)
        }

      prev[0].title=req.body.title;
      prev[0].email=req.body.email;
      prev[0].startDate=req.body.startDate;

      prev[0].endDate=req.body.endDate;

      prev[0]._id=req.body.sessionId
      prev[0].backgroundColor=req.body.backgroundColor;

            prev[0].save((err,event)=>{
                if(err)
                 res.json('error: server error');

                res.json('successfully updated')
            });
           
   })    
})

app.post('/delete',(req,res)=>{
    
    Calendar.find({
        email:req.body.email,
    },(err,prev)=>{
        if(err){
            res.json('error:server error')
        }

 Calendar.findOne({ email:req.body.email,_id : req.body.id}, function (err, model) {
    if (err) {
        return;
    }
    model.remove(function (err) {
        // if no error, your model is removed
        res.json('Event removed successfully')
    });
});

    })
    .catch(err=>console.log(err))  
})

app.post('/logout',(req,res)=>{
    res.json('unsuccess');
})

let connectedUsers=[];


io.on('connection', (socket) => {
    socket.on('join',({email,emailCredentials,name},callback)=>{
    //if(email)
    //socket.emit('message',{email:email,text:`hey ${name} welcome to the page`});
    //socket.broadcart.to(email).emit('message','')
    socket.join(email);
    socket.join(emailCredentials);
    //callback();
     connectedUsers[email]=socket;
    })
  
    

    socket.on('sendMessage',({email,message,userName,emailCredentials,userNameCredentials},callback)=>{
     //console.log(emailCredentials,message);
    //connectedUsers[emailCredentials].emit('message',{emailCredentials,message});
     //connectedUsers[emailCredentials]=socket;
     // console.log(message , emailCredentials);
     socket.broadcast.emit('recieveMessage',{emailCredentials,email,message});
     //connectedUsers[email].emit('recieveMessage',{emailCredentials,message});



      Chat.find({
        "$or":[{toEmail:email,fromEmail:emailCredentials},{toEmail:emailCredentials,fromEmail:email}]
      },(err,previous)=>{
        // if(err){
        //    return res.json(
        //        'error:unable to send message resend the message again'
        //     );
        // }
        if(previous.length===0){

             const newUser=new Chat();
             newUser.fromEmail=emailCredentials;
             newUser.toEmail=email;
             newUser.message={email,emailCredentials,message};
             newUser.timeStamp=new Date();
                newUser.save((err,user)=>{
                })

        }
        else{
            const messages=[...previous[0].message,{email,emailCredentials,message,timeStamp:new Date()}];
            previous[0].message=messages;
            previous[0].save((err,data)=>{
            })
           // console.log(previous[0])
        }
      })
      socket.emit('message',{user:email,text:message});
    
      callback();
    })

    // socket.on('disconnect',()=>{
    //     console.log('user had left!!')
    // })
 })

  

mongoose.connect(process.env.MONGODB_URI || process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb+srv://ajay:ajstyles89@cluster0-zvrc2.mongodb.net/alumini-student?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true },
    (req, res) => {
        console.log('connected to database')
    }
)


server.listen(port,"0.0.0.0", () => console.log(`server is running on port ${port}`));