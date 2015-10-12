// Visiblity API startup
// This block is to handle different browser implementations of the VisibilityAPI
var hiddenObj, visChangeEvent;
var connectionIsReady = false;
var connection = new WebSocket('ws://192.168.1.91:9000');
connection.onopen = function () {
    connectionIsReady = true;
    connection.send('Connection Initialized Successfully'); // Send the message 'Ping' to the server       

};
connection.onmessage = function(e) {
   if (typeof e.data == "string") {
      console.log("Text message received: " + e.data);
   } else {
      var arr = new Uint8Array(e.data);
      var hex = '';
      for (var i = 0; i < arr.length; i++) {
         hex += ('00' + arr[i].toString(16)).substr(-2);
      }
      console.log("Binary message received: " + hex);
   }
}

connection.onclose = function(e) {
   console.log("Connection closed.");
   socket = null;
   isopen = false;
}

if (typeof document.hidden !== "undefined") {
    hiddenObj = "hidden";
    visChangeEvent = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
    hiddenObj = "msHidden";
    visChangeEvent = "msvisibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
    hiddenObj = "mozHidden";
    visChangeEvent = "mozvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
    hiddenObj = "webkitHidden";
    visChangeEvent = "webkitvisibilitychange";
}

function PrivacyClose() {
    $("#privacy").hide(1500, function () {
        $("#privacyheader").show();
        $("#appcontext").show();
        $("#appcontext").find("div").show();
        main_logic();
    });
};

function PlatformReady() {
    $("#checkok").hide(2000, function () {
        $("#privacy").show(1000);
    });
};

function Start() {
    $("div").hide();
    $("#check").show(500, function () {
        // check platform compatibility
        intel.realsense.SenseManager.detectPlatform(['hand'], ['front']).then(function (info)
        {    
            console.log(info);

            document.getElementById("Start").disabled = true;
            if (info.nextStep == 'ready') {
                $("#check").hide(2000, function () {
                    $("#checkok").show(500, function () {
                        setTimeout(PlatformReady, 2000);
                    });
                });
                document.getElementById("Start").disabled = false;
            }
            else if (info.nextStep == 'unsupported') {
                $('#fail').append('<b> Platform is not supported for Intel(R) RealSense(TM) SDK: </b>');
                $('#fail').append('<b> either you are missing the required camera, or your OS and browser are not supported </b>');
                $('#fail').show();
            } else if (info.nextStep == 'driver') {
                $('#fail').append('Please update your camera driver from your computer manufacturer.');
                $('#fail').show();
            } else if (info.nextStep == 'runtime') {
                $('#download').show(1000);
            }

        }).catch(function (error) {
            $('#fail').append("CheckPlatform failed " + JSON.stringify(error));
            $('#fail').show();
        });
    });
}

function main_logic() {

    // Close when page goes away
    var sense;
    $(window).bind("beforeunload", function (e) {
        if (sense != undefined) {
            sense.release().then(function (result) {
                sense = undefined;
            });
        }
    })

    $(document).ready(function () {

        var rs = intel.realsense; // name space short-cut
        var handModule; // hand module instance
        var handConfig; // hand module configuration instance

        var imageSize; //image stream size
        var scaleFactor = 1900;// scaleFactor for the sample renderer
        var nodestorender; // data structure to hold sphere objects to render

        // Pause the module when the page goes out of view
        $(document).bind(visChangeEvent, function () {
            if (sense !== undefined && handModule !== undefined) {
                if (document[hiddenObj]) {
                    handModule.pause(true);
                }
                else {
                    handModule.pause(false);
                }
            }
        });

        $('#Start').click(function () {
            document.getElementById("Start").disabled = true;

            // Create a SenseManager instance
            rs.SenseManager.createInstance().then(function (result) {
                sense = result;
                return rs.hand.HandModule.activate(sense);
            }).then(function (result) {
                handModule = result;
                status('Init started');

                // Set the on connect handler
                sense.onDeviceConnected = onConnect;

                // Set the status handler
                sense.onStatusChanged = onStatus;

                // Set the data handler
                handModule.onFrameProcessed = onHandData;

                // SenseManager Initialization
                return sense.init();
            }).then(function (result) {

                // Configure Hand Tracking
                return handModule.createActiveConfiguration();
            }).then(function (result) {
                handConfig = result;

                // Enable all alerts
                handConfig.allAlerts = true;

                // Enable all gestures
                handConfig.allGestures = true;

                // Apply Hand Configuration changes
                return handConfig.applyChanges();
            }).then(function (result) {
                return handConfig.release();
            }).then(function (result) {
                // Query image size 
                imageSize = sense.captureManager.queryImageSize(rs.StreamType.STREAM_TYPE_DEPTH);

                // Start Streaming
                return sense.streamFrames();
            }).then(function (result) {
                status('Streaming ' + imageSize.width + 'x' + imageSize.height);
                document.getElementById("Stop").disabled = false;

                //initialize sample renderer
                if (scene == null) {
                    nodestorender = initHandRenderer(imageSize.width, imageSize.height);
                }

            }).catch(function (error) {
                // handle pipeline initialization errors
                status('Init failed: ' + JSON.stringify(error));
                document.getElementById("Start").disabled = false;
            });
        });
        

        // Process hand data when ready
        function onHandData(sender, data) {

            

            // if no hands found
            if (data.numberOfHands == 0) return;

            // retrieve hand data 
            var allData = data.queryHandData(rs.hand.AccessOrderType.ACCESS_ORDER_NEAR_TO_FAR);

            // for every hand in current frame
            for (h = 0; h < data.numberOfHands; h++) {
                var ihand = allData[h]; //retrieve hand data
                var joints = ihand.trackedJoints; //retrieve all the joints
                connection.send('HAND: ' + JSON.stringify(ihand));
                // for every joint
                for (j = 0; j < joints.length; j++) {

                    // if a joint is not valid
                    if (joints[j] == null || joints[j].confidence <= 0) continue;

                    // update sample renderer joint position
                    nodestorender[h][j].position.set(joints[j].positionWorld.x * scaleFactor, joints[j].positionWorld.y * scaleFactor, joints[j].positionWorld.z * scaleFactor);
                }
            }

            // retrieve the fired alerts
            for (a = 0; a < data.firedAlertData.length; a++) {
                $('#alerts_status').text('Alert: ' + JSON.stringify(data.firedAlertData[a]));
                var _label = data.firedAlertData[a].label;

                // notify the sample renderer the tracking alerts
                if (_label == rs.hand.AlertType.ALERT_HAND_NOT_DETECTED || _label == rs.hand.AlertType.ALERT_HAND_NOT_TRACKED || _label == rs.hand.AlertType.ALERT_HAND_OUT_OF_BORDERS) {
                    clearHandsPosition();
                    connection.send('*** NO HANDS DETECTED ***');
                }
            }

            // retrieve the fired gestures
            for (g = 0; g < data.firedGestureData.length; g++) {
                $('#gestures_status').text('Gesture: ' + JSON.stringify(data.firedGestureData[g]));
                connection.send('GESTURE: ' + JSON.stringify(data.firedGestureData[g]);
            }


        }

        // stop streaming
        $('#Stop').click(function () {
            document.getElementById("Stop").disabled = true;
            sense.release().then(function (result) {
                status('Stopped');
                sense = undefined;
                clear();
            });
        });

        // On connected to device info
        function onConnect(sender, connected) {
            if (connected == true) {
                $('#alerts_status').append('Connect with device instance: ' + sender.instance + '<br>');
            }
        }

        // Error status
        function onStatus(sender, sts) {
            if (sts < 0) {
                status('Module error with status code: ' + sts);
                clear();
            }
        }

        // Status msg
        function status(msg) {
            $('#status').text(msg);
        };

        // clear alerts & gestures
        function clear() {
            clearHandsPosition();
            $('#alerts_status').text('');
            $('#gestures_status').text('');
            document.getElementById("Start").disabled = false;
        };

    });

};


$(document).ready(Start);

