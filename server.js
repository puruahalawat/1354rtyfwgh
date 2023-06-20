/*********************************************************************************
* WEB322 – Assignment 04
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: _PURU AHALAWAT_____________________ Student ID: _170440218_____________ Date: ___19-06-2023_____________
*
* Cyclic Web App URL: __________________https://ill-cyan-kangaroo-vest.cyclic.app/about______________________________________
*
* GitHub Repository URL: _https://github.com/puruahalawat/1354rtyfwgh_____________________________________________________
*
********************************************************************************/

var express = require("express");
const exphbs = require("express-handlebars");
const stripJs = require('strip-js');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
var app = express();
var path = require('path');
var blogservice = require("./blog-service.js");
var HTTP_PORT = process.env.PORT || 8080;

onHttpStart = () => {
  console.log('Express http server listening on port ' + HTTP_PORT);
}

app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.engine(
  "hbs",
  exphbs.engine({
    
    helpers: {
      navLink: function (url, options) {
        return '<li' + 
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function(context){
        return stripJs(context);
      }
    },
    extname: ".hbs"
  })
);
app.set("view engine", ".hbs");


// Create an "upload" variable without disk storage
const upload = multer();

// POST /posts/add route
app.post("/posts/add", upload.single("featureImage"), (req, res) => {
  
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  async function upload(req) {
    let result = await streamUpload(req);
    return result;
  }

  
  upload(req)
  .then((uploaded) => {
    req.body.featureImage = uploaded.url;
    let postObject = {};

   
    postObject.body = req.body.body;
    postObject.title = req.body.title;
    postObject.postDate = Date.now();
    postObject.category = req.body.category;
    postObject.featureImage = req.body.featureImage;
    postObject.published = req.body.published;
    
  
    if (postObject.title) {
      addPost(postObject);
    }
    res.redirect("/posts");
  })
  .catch((err) => {
    res.send(err);
  });
});


app.use(express.static('public'));         
app.set('json spaces', 2); 

cloudinary.config({
  cloud_name: 'Cloud Name',
  api_key: 'API Key',
  api_secret: 'API Secret',
  secure: true
 });

app.get("/", (req, res) => {
  res.redirect('/about');
});


app.get("/about", (req, res) => {
  res.render("about");
});


app.get('/blog', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];
      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogservice.getPublishedPostsByCategory(parseInt(req.query.category,10));
      }else{
          // Obtain the published "posts"
          posts = await blogservice.getPublishedPosts();
      }
      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // get the latest post from the front of the list (element 0)
      let post = posts[0]; 

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;
      viewData.post = post;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogservice.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})

});

app.get('/blog/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogservice.getPublishedPostsByCategory(parseInt(req.query.category,10));
      }else{
          // Obtain the published "posts"
          posts = await blogservice.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the post by "id"
      viewData.post = await blogservice.getPostById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogservice.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
});



app.get("/categories", (req, res) => {
  blogservice
    .getCategories()
    .then((categories) => {
      res.render("categories", { categories });
    })
    .catch((err) => {
      res.render("categories", { message: "no results" });
    });
});

app.get("/posts/add",(req,res) => {
  res.render("addPost");
});

app.get("/posts", (req, res) => {
  let cat = parseInt(req.query.category, 10);
  let date = req.query.minDate;

  if (cat) {
    blogservice
      .getPostsByCategory(cat)
      .then((posts) => res.render("posts", {posts: posts}))
      .catch((err) => res.render("posts", {message: "no results"}));
  } else if (date) {
    blogservice
      .getPostsByMinDate(date)
      .then((posts) => res.render("posts", {posts: posts}))
      .catch((err) => res.render("posts", {message: "no results"}));
  } else {
    blogservice
      .getAllPosts()
      .then((posts) => res.render("posts", {posts: posts}))
      .catch((err) => res.render("posts", {message: "no results"}));
  }
});




//Adding "/post/value" route
app.get('/post/:id', (req,res) => {
  blogservice.getPostById(req.params.id).then((data) => {
      res.json({data});
  }).catch((err) => {
      res.json({message: err});
  })
});

app.use((req, res) => {
  res.status(404).end('404 PAGE NOT FOUND');
});


blogservice.initialize().then(() => {
  app.listen(HTTP_PORT, onHttpStart());
}).catch (() => {
  console.log("There was an error initializing");
});




