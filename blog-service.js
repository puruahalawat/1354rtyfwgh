const fs = require("fs");    
var posts;
var categories;

var exports = module.exports = {};

exports.initialize = () => {
    return new Promise ((resolve, reject) => {
       try {
        fs.readFile('./data/posts.json','utf8', (err,data) => {
            if (err) throw err;

                posts = JSON.parse(data);
                fs.readFile('./data/categories.json','utf8', (err,data)=> {
                    if (err) throw err;
                    categories = JSON.parse(data);
                    resolve();
                });
        });
       } catch (error) {
        reject ('unable to read file');
        
       } 
    });
};

exports.getAllPosts = () => {
    return new Promise ((resolve,reject) => {
        if (posts.length == 0) {
            reject('no results returned');
        }
        else {
            resolve(posts);
        }
    })
};

exports.getPublishedPosts = () => {
    return new Promise ((resolve, reject) => {
        var blog = posts.filter(post => post.published == true);
        if (blog.length == 0) {
            reject('no results returned');
        }
        resolve(blog);
    })
};

exports.getCategories = () => {
    return new Promise((resolve,reject) => {
        if (categories.length == 0) {
            reject ('no results returned');
        }
        else {
            resolve (categories);
        }
    })
};

exports.addPost = (postData) => {
   return new Promise((resolve, reject) => {
    if (postData.published === undefined) postData.published = false;
    else postData.published = true;
    postData.id = posts.length + 1;
    postData.category = parseInt(postData.category, 10);
    postData.postDate = new Date().toISOString().slice(0, 10);
    posts.push(postData);
    resolve(postData);
  });
};


  exports.getPostsByCategory = (category) => {
    return new Promise(function(resolve, reject) {
      const filteredPosts = posts.filter(post => post.category === category);
      if (filteredPosts.length === 0) {
        reject("no results returned");
      } else {
        resolve(filteredPosts);
      }
    });
  }
  

exports.getPostsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
      const filteredPosts = posts.filter((post) => new Date(post.postDate) >= new Date(minDateStr));
      if (filteredPosts.length === 0) {
        reject("No results returned");
      } else {
        resolve(filteredPosts);
      }
    });
  };

exports.getPostById = (id) => {
    return new Promise(function(resolve, reject) {
      const post = posts.find(p => p.id == id);
      if (post) {
        resolve(post);
      } else {
        reject("no result returned");
      }
    });
  }
  
  exports.getPublishedPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
      const filteredPosts = posts.filter(
        (post) => post.published === true && post.category === category
      );
      if (filteredPosts.length === 0) reject("No results returned");
      else resolve(filteredPosts);
    });
  };