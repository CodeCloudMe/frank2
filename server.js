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

var MongoClient = require('mongodb').MongoClient;


 MongoClient.connect('mongodb://'+connection_string, function(err, db) {

    
    dbv=db;
     //console.log(dbv)
    })



var MongoClient1 = require('mongodb').MongoClient;


 MongoClient1.connect('mongodb://'+connection_string, function(err, db) {

    
    apiDB=db;
     //console.log(dbv)

     //console.log(apiDB)
    })






function tweetScale(searchTerm, user){

    var tweetSessionLimit = 5;
    var tweetsThisSession =0;
  var twitterLinks=[];
   var twitterStatuses=[];
    var twitterResEng=[];
   var params = {count:200, lang:"en", "result_type":'recent'};
            twitter = require('twitter');

                var crafter=user['username'];
               var  crafterKeyword = user['category'];
                

                var twit3 = new twitter({
                consumer_key: user['key'],
                consumer_secret: user['secret'],
                 access_token_key: user['token'],
                access_token_secret: user['tokensecret']
            });
twit3.search(searchTerm, params , function(data) {

                //console.log(data);
               var  twitterRes= data['statuses'];
                for(i in twitterRes){
                    try{
                        if(twitterRes[i]['entities']['urls'][0]['expanded_url']!=''){
                            var status = twitterRes[i]['text'];
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
              var  theC= 0;
              theNewC =0;
            for(i in twitterStatuses){
                 saveArr.push({"status":twitterStatuses[i], "link":twitterLinks[i], "crafter":user['username'], "category":searchTerm});
               

                apiDB.collection('twitterLinks').find({"status":twitterStatuses[i]}).toArray(function(err, results){
                   
                   //what's the numver you're on... theC...
                   var resu = results[0];
                    if(typeof resu != "undefined" ){
                        //this tweet does exists in db
                        console.log(results);
                        console.log("not posting:"+twitterStatuses[theC])

                        //
                    }
                    else{

                        if(tweetsThisSession<= tweetSessionLimit){

                            tweetsThisSession = tweetsThisSession+1;
                        
                      
                     
                            console.log("\n\n posting! \n \n");
                            //link without http or s
                            actualLink = twitterStatuses[theC].split('://')[1];
                            link = twitterStatuses[theC].split('://')[1].split(' ')[0];
                            post = twitterStatuses[theC].split(link)[0].split(/http:\/\/|https:\/\//)[0];
                             
                            //post after 1- 12 seconds so posts don't happen all at once
                            randTime = Math.floor(Math.random() * 10000) + 1;
                          
                           console.log("newC is"+theNewC);
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
                      else{

                            console.log("hit limit of tweets for user"+ crafter );
                          
                        }


                    }
                     theC = theC+1
                })

        //for saving
                   
                   theNewC = theNewC +1;
               
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
                       
              dbv.close();
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

                       



            twitter = require('twitter');

                crafter="sarahperk03";
                crafterKeyword = "fitness";
                var twit1 = new twitter({
                consumer_key: 'qBbEAUaLM76o51cjiGq1V8oAY',
                consumer_secret: 'ehgkjRRJQmYhGJRZUgTgNIc4eDET0dzC6hZEX1VnWZeMxZWvXz',
                access_token_key: '2687977814-5c96bGCFymL6Yo2cpB5J40hGeIPyWBk2W4y7zRn',
                access_token_secret: '8ilaJI6LeNp2OsmH51yw4uQlq2urdvhaghl4eIW9OOQ01'
            });




                //users

/*
                connie1 = {"username":"aprilwaking", 'category':'fashion', 'key':'lKnDiCEadgMuP6iNSm4dJW0vg', 'secret':'DEytPBHrbUfadI6uuDIBXoziEUl7Ze6yFG17TBYVdsX4JufpvA', 'token':'2693910547-AKH80ztv6A1ULMFxtPdtYhXBYo6JbUgvjkthSaD', 'tokensecret':'1sHKnMtH1fNkCrLdfCt7vavGxx2alQEEtqvqwOeUc309A'}
                connieSearch = "from:beautyblitz, OR from:CathyHorynNYT, OR from:glambr, OR from:styledotcom, OR from:vanityfair, OR from:StyleCaster, OR from:fashgonerogue, OR from:popsugarbeauty"
*/

        twitterObjs =
            [
                [{"username":"rebbyham", 'category':'fashion', 'key':'Cxhp6whvvXPIIsw7L5OK4tMbH', 'secret':'Fq1LmYij4490z5cJ6ExM16Q5fAhBWC7KMndu70G5ur8lIHkPpY', 'token':'2688197214-DA6imGpQUPNUVIRiWaop3hE0F1q6galbmn4gCcc', 'tokensecret':'ZL0FAzPLSxuYwc8QAAhtlx0daVGSBQX3erywO0sVAmhHT', 'password':"MYson0352"}
                ,"from:beautyblitz, OR from:CathyHorynNYT, OR from:glambr, OR from:styledotcom, OR from:vanityfair, OR from:StyleCaster, OR from:fashgonerogue, OR from:popsugarbeauty, OR from:vogue"],

                  [{"username":"sherridayo", 'category':'fitness', 'key':'E6lIu13MvjiVW3V315E6oeG6C', 'secret':'QWd27hVsHRj3kRJsFWhWhrAgcz6jRUXveYtPOGiCjVG9gf25xg', 'token':'2688233732-Lqvd41F8STLT5HlXceJk6zQxToLgVm6Tcr7BGuK', 'tokensecret':'UE8qdGt6GFxHKvldZ5gP7bLUaRHPli68ikV9w4km6zacp', 'password':"MYson0352"}
                ,"from:greatist, OR from:dailyburn, OR from:FitBottomedGirl, OR from:TFerriss, OR from:bornfitness, OR from:ElephantJournal, OR from:AthleticFoodie, OR from:zentofitness, OR from:lululemon, OR from:yogadork"],


                [{"username":"emilyneels", 'category':'fitness', 'key':'zTrG0GTRDAeZYv6rXA0JiENZw', 'secret':'khA9bMIeMSMG61p41qhqv9glqC7eczmvqeTsFe72ISjwt8rTO2', 'token':'2688188420-y80CFkE9wONkvtROCXyEcmdeFGUgaoMR5RDCAni', 'tokensecret':'M85Jsopw5vz5yAdfGvh0qaMNnyNuXiELVpLWcgtaarE9z'}
                ,"from:RobbWolf, OR from:trinkfitness, OR from:martinberkhan, OR from:JasonFerruggia, OR from:erwan_le_corre, OR from:johnromaniello, OR from:stevekamb, OR from:iRunnerBlog, OR from:profspiker, OR from:TaraStiles"],
                
                
            ]

            twitterTimer = 5000;
            userCounter=0;
            for(z in twitterObjs){

                 setTimeout(function(){
                    
                  console.log('starting another user '+ twitterObjs[userCounter][0]['username']);

                  //twitterObj[1] is term on twitter to search and [0] is twitter user credentials
                      tweetScale(twitterObjs[userCounter][1], twitterObjs[userCounter][0]);
                      userCounter= userCounter+1;

                }, twitterTimer);

                 twitterTimer = twitterTimer+10000;
            }
               
            












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

