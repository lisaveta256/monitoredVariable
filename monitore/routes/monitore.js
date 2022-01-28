var express = require('express');
var router = express.Router();
//var reload = require('reload');
var alert = require('alert');

const {
    OPCUAClient,
    AttributeIds,
    ClientSubscription,
    TimestampsToReturn
} = require("node-opcua");
const async = require("async");


/* GET home page */
router.get('/', function (req, res, next) {
    const client = OPCUAClient.create({ endpoint_must_exist: false });
    const endpointUrl = "opc.tcp://localhost:4840";
    const nodeId = "ns=4;s=HMI_Power.PS_ABS_wState";
    var data = '--';



    /** @type ClientSession */
    let theSession = null;

    /** @type ClientSubscription */
    let theSubscription = null;
    async.series([


        // step 1 : connect to
        function (callback) {

            client.connect(endpointUrl, function (err) {

                if (err) {
                    console.log(" cannot connect to endpoint :", endpointUrl);
                } else {
                    console.log("connected !");
                }
                callback(err);
            });
        },
        // step 2 : createSession
        function (callback) {
            client.createSession(function (err, session) {
                if (!err) {
                    theSession = session;
                }
                callback(err);
            });

        },
        // step 3 : browse
        function (callback) {

            theSession.browse("RootFolder", function (err, browse_result) {
                if (!err) {
                    browse_result.references.forEach(function (reference) {
                        console.log(reference.browseName);
                    });
                }
                callback(err);
            });
        },
        // step 4 : read a variable
        function (callback) {
            theSession.read({
                nodeId,
                attributeId: AttributeIds.Value
            }, (err, dataValue) => {
                if (!err) {
                    console.log(" read value = ", dataValue.toString());
                   data = 'old: '+dataValue.toString();
                   

                //   res.render('variable',{data});
              //  res.redirect('/variable')
                }
                callback(err);
            })
        },

        // step 5: install a subscription and monitored item
        //
        // -----------------------------------------
        // create subscription
        function (callback) {

            theSession.createSubscription2({
                requestedPublishingInterval: 1000,
                requestedLifetimeCount: 1000,
                requestedMaxKeepAliveCount: 20,
                maxNotificationsPerPublish: 10,
                publishingEnabled: true,
                priority: 10
            }, function (err, subscription) {
                if (err) { return callback(err); }
                theSubscription = subscription;

                theSubscription.on("keepalive", function () {
                    console.log("keepalive");
                }).on("terminated", function () {
                });
                callback();
            });

        }, function (callback) {
            // install monitored item
            //
            theSubscription.monitor({
                nodeId,
                attributeId: AttributeIds.Value
            },
                {
                    samplingInterval: 100,
                    discardOldest: true,
                    queueSize: 10
                }, TimestampsToReturn.Both,
                (err, monitoredItem) => {
                    console.log("-------------------------------------");
                    monitoredItem
                        .on("changed", function (value) {
                            console.log(" New Value = ", value.toString());
                           data = 'new:'+value.toString();
                          // res.redirect(req.originalUrl);
                          // res.redirect(req.get('referer'));
                      //     alert('Hello');
                           // refresh page here
               // window.location.replace('http://localhost:8082/');
              // res.redirect('back');
             // res.redirect('error');
           //  res.redirect('https://youtube.com'); 
           res.redirect('/variable')
              //window.location.reload(true);
                           //res.render('variable',{data});
                           
                        })
                        .on("err", (err) => {
                            console.log("MonitoredItem err =", err.message);
                        });
                    callback(err);

                });
        }, function (callback) {
            console.log("Waiting 5 seconds")
            setTimeout(() => {
                theSubscription.terminate();
                callback();
            }, 155000);
        }, function (callback) {
            console.log(" closing session");
            theSession.close(function (err) {
                console.log(" session closed");
                callback();
            });
        },

    ],
        function (err) {
            if (err) {
                console.log(" failure ", err);
                process.exit(0);
            } else {
                console.log("done!");
            }
            client.disconnect(function () { });
        });

    
});

module.exports = router;