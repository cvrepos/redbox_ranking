//change API_KEY to your auth key obtained from rottentomatoes.com
var API_KEY = "YOUR_API_KEY";

var sys = require('util'),
    http = require('http'),
    fs = require('fs'),
    index;
function readFile(filename) { 
    var content  = fs.readFileSync('./' + filename);
    return content;
}

function respond(content, response, movie, stringify)
{
    var data;
    if(content == null){
        content = new Object();
        content.critics_score = "none";
        content.audience_score = "none";
        content.id = "";
    }
    if(stringify == false){
        data = content;
    }else{
        data = JSON.stringify(content);
    }
    console.log("Sending data:"+ data);
    response.writeHead(200, {'Content-Length': data.length, 'Content-Type': 'text/json'});
    response.write(data);
    response.end();
    return data;
}

function findRanking(movie, response)
{
    try{
    var moviePath = "./movies/" + movie;
    fs.lstat(moviePath, function(err, stats){
      //return the ranking by reading the file
      if(stats && stats.isFile()){
        var content = fs.readFileSync(moviePath);
        var data = respond(content, response, movie, false);
        console.log("Found Movie:" +movie +" data:" + data);
      }else{
         //else query rotten tomatoes directly
         getRankings(movie, function(id, ratings){
              if(id == null){
                   respond(null, response, movie, true);
                   return;
              }
              if(ratings){
                   if(ratings == null){
                      respond(null, response, movie, true);
                      return;
                   }
                   console.log("critics ranking is:" + ratings.critics_score + ". audience ranking is:" + ratings.audience_score);
                   var content = new Object();
                   content.critics_score = ratings.critics_score;
                   content.audience_score = ratings.audience_score;
                   content.id = id;
                   content.name = movie;
                   var jsonContent = respond(content, response, movie, true);
                   try{
                       var ifile = fs.openSync(moviePath, "w");
                       fs.writeSync(ifile, jsonContent);
                       fs.close(ifile);
                   }catch(err){
                       console.log("Exception caught:" + err);
                   }
              }
         });
      }
    });
    }catch(err){
        console.log("Exception:" + err);
        respond(null, response, movie, true);
    }
}

function getRankings(movie, callback) {
    console.log("movie is :" + movie);
    var urlPath = "/api/public/v1.0/movies.json?q=" + encodeURIComponent(movie) + "&page_limit=5&page=1&apikey=" + API_KEY;
    var options = {
      host: 'api.rottentomatoes.com',
      port: 80,
      path: urlPath,
      method: 'GET'
    };
    var msgBody = "";
    var req = http.request(options, function(res) {
            console.log('STATUS: ' + res.statusCode);
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                msgBody += chunk;
            });
            res.on('end', function(){
                if(msgBody!= "" && res.statusCode == 200){
                    var movieObject = JSON.parse(msgBody);
                    if(movieObject.movies == null || movieObject.movies.length == 0){
                       callback(null, null);
                       return;
                    }
                    if(movieObject.movies.length == 1){
                      // only a single movie - lets assume that this is THE movie we are looking for 
                      var item = movieObject.movies[0];
                      callback(item.id, item.ratings);
                      return;
                    }
                    // asuming the first movie in the result is the movie I am looking for
                    // tallying the results, year of release  will yeild more accurate information
                    for(var i = 0; i<movieObject.movies.length; i++){
                        var item = movieObject.movies[i];
                        if(movie == item.title.toUpperCase()){
                           var id = item.id;
                           console.log("Id of the movie is:" + id);
                           callback(id, item.ratings);
                           return;
                        }else{
                          console.log("title=[" + movie + "] and movie=[" + item.title + "] does not match.");
                        }
                    }
                    callback(null, null);
                }else{
                    callback(null, null);
                }
            });
    });

    req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
    });

    req.end();
}

function normalize(name)
{
    var decoded  = decodeURIComponent(name);
    var replaced = decoded.replace(/\(.*\)/,"");
    var trimmed = replaced.trim().toUpperCase();
    return trimmed;
}
http.createServer(function (request, response) {
  console.log(request.url);
  var result = request.url.match(/^\/(.*\.js)/);
  if(result) {
      response.writeHead(200, {'Content-Type': 'text/javascript'});
      response.write(readFile(result[1]));
      response.end();
  } else if(request.url.indexOf("add?&id=") != -1){
      var vals = request.url.split("=");
      console.log(vals[vals.length-1]);
      var nMovie = normalize(vals[vals.length-1]);
      findRanking(nMovie, response);
  }
  else{
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write(readFile('index.html'));
      response.end();
  }
}).listen(8989);

console.log('Server running at http://127.0.0.1:8989/');
