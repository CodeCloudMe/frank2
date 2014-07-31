#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');




//maybe don't need
// default to a 'localhost' configuration:
var connection_string = '127.0.0.1:27017/frank';
// if OPENSHIFT env variables are present, use the available connection info:
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}



var dbv;
var apiDB;

function activateDBs(){
MongoClient = require('mongodb').MongoClient;


 MongoClient.connect('mongodb://'+connection_string, function(err, db) {

    
    dbv=db;
     //console.log(dbv)
    })



MongoClient1 = require('mongodb').MongoClient;


 MongoClient1.connect('mongodb://'+connection_string, function(err, db) {

    
    apiDB=db;
     //console.log(dbv)

     //console.log(apiDB)
    })
}

//active the DB on init here
activateDBs();



function tweetScale(searchTerm, user){

  var twitterLinks=[];
   var twitterStatuses=[];
    var twitterResEng=[];
    params = {count:200, lang:"en", "result_type":'recent'};
            twitter = require('twitter');

                crafter=user['username'];
                crafterKeyword = user['category'];
                var twit3 = new twitter({
                consumer_key: user['key'],
                consumer_secret: user['secret'],
                access_token_key: user['token'],
                access_token_secret: user['tokensecret']
            });
twit3.search(searchTerm, params , function(data) {

                //console.log(data);
                twitterRes= data['statuses'];
                for(i in twitterRes){
                    try{
                        if(twitterRes[i]['entities']['urls'][0]['expanded_url']!=''){
                            status = twitterRes[i]['text'];
                            twitterLinks.push(twitterRes[i]['entities']['urls'][0]['expanded_url']);
                            twitterStatuses.push(status);
                        }
                    }
                    catch(err){

                            // do nothing.... doesn't have link
                    }
                    
                    if(twitterRes[i]['metadata']['iso_language_code']=="en")
                        twitterResEng.push(twitterRes[i]);
                }

                saveArr= [];
               theC= 0;
            for(i in twitterStatuses){


                apiDB.collection('twitterLinks').find({"status":twitterStatuses[i]}).toArray(function(err, results){

                    resu = results[0];
                    if(typeof resu != "undefined" ){
   
                        console.log(results);
                        console.log("not posting:"+twitterStatuses[theC])

                        //
                    }
                    else{

                     
                            console.log("\n\n posting! \n \n");
                            //link without http or s
                            actualLink = twitterStatuses[theC].split('://')[1];
                            link = twitterStatuses[theC].split('://')[1].split(' ')[0];
                            post = twitterStatuses[theC].split(link)[0].split(/http:\/\/|https:\/\//)[0];
                             
                            //post after 1- 12 seconds so posts don't happen all at once
                            randTime = Math.floor(Math.random() * 20000) + 1;
                          
                            var theFullPost= post +" " + "http://emcade.com/n/http://"+actualLink;
                            setTimeout(function(){
                                    console.log(theFullPost);
                                        twit3.updateStatus(theFullPost,
                                    function(data) {
                                        console.log((data));
                                    }
                                    );

                            }, randTime, theFullPost);
                             

                       
                        //post
                    }

                     theC = theC+1
                })

                saveArr.push({"status":twitterStatuses[i], "link":twitterLinks[i], "crafter":user['username'], "category":searchTerm});
               
            }


            setTimeout(function(){
             dbv.collection('twitterLinks').insert( saveArr,function(err, records){
              if(err) { console.log('write error: '+err);}


              //console.log(saveArr);
              console.log('records saved up');


            })

         }, 5000);

            console.log(twitterStatuses);
          



        });
}
/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {

            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };






        //start example timer


        self.routes['/api/exampletimer']= function(req, res){

            res.setHeader('Content-Type', 'text/html');
            if(typeof req.query.interval == "undefined"){
                var interval = 1;
            }
            else{
                var interval= parseInt(req.query.interval);
            }

            var schedule = require('node-schedule');

            var rule = new schedule.RecurrenceRule();

            rule.minute = new schedule.Range(0, 59, interval);


            var k = schedule.scheduleJob(rule, function(){
                       
              //dbv.close();
                    console.log('starting timer');
                       
                       
            });

            res.send("scheduled every "+ interval);


        }




        //sample timer end


         self.routes['/api/tbr']= function(req, res){


            twitterHandles= ['gigaom', 'techcrunch'];

            res.setHeader('Content-Type', 'text/html');
            if(typeof req.query.interval == "undefined"){
                var interval = 1;
            }
            else{
                var interval= parseInt(req.query.interval);
            }

            var schedule = require('node-schedule');

            var rule = new schedule.RecurrenceRule();

            rule.minute = new schedule.Range(0, 59, interval);


            var k = schedule.scheduleJob(rule, function(){
                       

                    console.log('starting timer');
                    dbv.close();


                    setTimeout(function(){
                        activateDBs();   
                    },500);
                       



            twitter = require('twitter');

                crafter="sarahperk03";
                crafterKeyword = "fitness";
                var twit1 = new twitter({
                consumer_key: 'qBbEAUaLM76o51cjiGq1V8oAY',
                consumer_secret: 'ehgkjRRJQmYhGJRZUgTgNIc4eDET0dzC6hZEX1VnWZeMxZWvXz',
                access_token_key: '2687977814-5c96bGCFymL6Yo2cpB5J40hGeIPyWBk2W4y7zRn',
                access_token_secret: '8ilaJI6LeNp2OsmH51yw4uQlq2urdvhaghl4eIW9OOQ01'
            });


                crafter2="pdcolgan";
                crafterKeyword2 = "fashion";
                var twit2 = new twitter({
                consumer_key: 'jvwezQbOfMUjWivwFtV7UltHZ',
                consumer_secret: 'fltcMGbIIQXgwTGpEKX4JJzpIBfUtxXcRJBwES8qDjU0sG2HOv',
                access_token_key: '2687974634-CqmF23m6Fg4BzbRaJNZAsAU0SaMYZWXKagTqhV1',
                access_token_secret: 'BgoybBZxTllaDDoBTqmrmgNXmnisw1TNTXJGRcyTamnNj'
            });


                //users


                connie1 = {"username":"aprilwaking", 'category':'fashion', 'key':'lKnDiCEadgMuP6iNSm4dJW0vg', 'secret':'DEytPBHrbUfadI6uuDIBXoziEUl7Ze6yFG17TBYVdsX4JufpvA', 'token':'2693910547-AKH80ztv6A1ULMFxtPdtYhXBYo6JbUgvjkthSaD', 'tokensecret':'1sHKnMtH1fNkCrLdfCt7vavGxx2alQEEtqvqwOeUc309A'}
                connieSearch = "from:beautyblitz, OR from:CathyHorynNYT, OR from:glambr, OR from:styledotcom, OR from:vanityfair, OR from:StyleCaster, OR from:fashgonerogue, OR from:popsugarbeauty"

                setTimeout(function(){

                  console.log('starting connie');
                      tweetScale(connieSearch, connie1);
                }, 20000);
            


            twitterLinks= [];
            twitterStatuses=[];
            twitterResEng=[];
           
            params = {count:200, lang:"en", "result_type":'recent'};
            twit1.search("from:joedowdellnyc, OR from:huffingtonpost", params , function(data) {

                //console.log(data);
                twitterRes= data['statuses'];
                for(i in twitterRes){
                    try{
                        if(twitterRes[i]['entities']['urls'][0]['expanded_url']!=''){
                            status = twitterRes[i]['text'];
                            twitterLinks.push(twitterRes[i]['entities']['urls'][0]['expanded_url']);
                            twitterStatuses.push(status);
                        }
                    }
                    catch(err){

                            // do nothing.... doesn't have link
                    }
                    
                    if(twitterRes[i]['metadata']['iso_language_code']=="en")
                        twitterResEng.push(twitterRes[i]);
                }

                saveArr= [];
               theC= 0;
            for(i in twitterStatuses){


                apiDB.collection('twitterLinks').find({"status":twitterStatuses[i]}).toArray(function(err, results){

                    resu = results[0];
                    if(typeof resu != "undefined" ){
   
                        console.log(results);
                        console.log("not posting:"+twitterStatuses[theC])

                        //
                    }
                    else{

                     
                            console.log("\n\n posting! \n \n");
                            //link without http or s
                            actualLink = twitterStatuses[theC].split('://')[1];
                            link = twitterStatuses[theC].split('://')[1].split(' ')[0];
                            post = twitterStatuses[theC].split(link)[0].split(/http:\/\/|https:\/\//)[0];
                             
                            //post after 1- 12 seconds so posts don't happen all at once
                            randTime = Math.floor(Math.random() * 20000) + 1;
                          
                            var theFullPost= post +" " + "http://emcade.com/n/http://"+actualLink;
                            setTimeout(function(){
                                    console.log(theFullPost);
                                        twit1.updateStatus(theFullPost,
                                    function(data) {
                                        console.log((data));
                                    }
                                    );

                            }, randTime, theFullPost);
                             

                       
                        //post
                    }

                     theC = theC+1
                })

                saveArr.push({"status":twitterStatuses[i], "link":twitterLinks[i], "crafter":crafter, "category":crafterKeyword});
               
            }


            setTimeout(function(){
             dbv.collection('twitterLinks').insert( saveArr,function(err, records){
              if(err) { console.log('write error: '+err);}


              //console.log(saveArr);
              console.log('records saved up');


            })

         }, 5000);

            console.log(twitterStatuses);
          



        });






//user 2





setTimeout(function(){
   twitterLinks=[];
   twitterStatuses=[];
    twitterResEng=[];
twit2.search("from:luckymagazine, OR from:WomensWearDaily, OR from:Fashionista_com, OR from:Refinery29", params , function(data) {

                //console.log(data);
                twitterRes= data['statuses'];
                for(i in twitterRes){
                    try{
                        if(twitterRes[i]['entities']['urls'][0]['expanded_url']!=''){
                            status = twitterRes[i]['text'];
                            twitterLinks.push(twitterRes[i]['entities']['urls'][0]['expanded_url']);
                            twitterStatuses.push(status);
                        }
                    }
                    catch(err){

                            // do nothing.... doesn't have link
                    }
                    
                    if(twitterRes[i]['metadata']['iso_language_code']=="en")
                        twitterResEng.push(twitterRes[i]);
                }

                saveArr= [];
               theC= 0;
            for(i in twitterStatuses){


                apiDB.collection('twitterLinks').find({"status":twitterStatuses[i]}).toArray(function(err, results){

                    resu = results[0];
                    if(typeof resu != "undefined" ){
   
                        console.log(results);
                        console.log("not posting:"+twitterStatuses[theC])

                        //
                    }
                    else{

                     
                            console.log("\n\n posting! \n \n");
                            //link without http or s
                            actualLink = twitterStatuses[theC].split('://')[1];
                            link = twitterStatuses[theC].split('://')[1].split(' ')[0];
                            post = twitterStatuses[theC].split(link)[0].split(/http:\/\/|https:\/\//)[0];
                             
                            //post after 1- 12 seconds so posts don't happen all at once
                            randTime = Math.floor(Math.random() * 20000) + 1;
                          
                            var theFullPost= post +" " + "http://emcade.com/n/http://"+actualLink;
                            setTimeout(function(){
                                    console.log(theFullPost);
                                        twit2.updateStatus(theFullPost,
                                    function(data) {
                                        console.log((data));
                                    }
                                    );

                            }, randTime, theFullPost);
                             

                       
                        //post
                    }

                     theC = theC+1
                })

                saveArr.push({"status":twitterStatuses[i], "link":twitterLinks[i], "crafter":crafter2, "category":crafterKeyword2});
               
            }


            setTimeout(function(){
             dbv.collection('twitterLinks').insert( saveArr,function(err, records){
              if(err) { console.log('write error: '+err);}


              //console.log(saveArr);
              console.log('records saved up');


            })

         }, 5000);

            console.log(twitterStatuses);
          



        });


},10000);








//end timers
                       
            });


              

  res.send("scheduled ");

    };
}


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express.createServer();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

