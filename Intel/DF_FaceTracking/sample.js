// Visiblity API startup
// This block is to handle different browser implementations of the VisibilityAPI
var hiddenObj, visChangeEvent; 
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
}

function PlatformReady() {
    $("#checkok").hide(1500, function () {
        $("#privacy").show(1000);
    });
}

function Start() {
    $("div").hide();
    $("#check").show(500, function () {
        // check platform compatibility
        intel.realsense.SenseManager.detectPlatform(['face3d'], []).then(function (info) {
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
};


function main_logic() {
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
        var faceModule; // face module instance
        var faceConfig; // face module configuration instance

        var imageSize; //image stream size
        var factor = 0.05; // scaleFactor for the sample renderer
        var nodestorender; // data structure to hold sphere objects to render
        var maxTrackedFaces = 1; // sample renderer showcases only landmark points for upto 3 faces 

        // Pause the module when the page goes out of view
        $(document).bind(visChangeEvent, function() {
            if (sense !== undefined && faceModule !== undefined) {
                if (document[hiddenObj]) {
                    faceModule.pause(true);
                }
                else {
                    faceModule.pause(false);
                }
            }
        });

        $('#Start').click(function () {
            document.getElementById("Start").disabled = true;

            // Create a SenseManager instance
            rs.SenseManager.createInstance().then(function (result) {
                sense = result;
                return rs.face.FaceModule.activate(sense);
            }).then(function (result) {
                faceModule = result;
                return faceModule.createActiveConfiguration();
            }).then(function (result) {
                faceConfig = result;

                // Enable face detection
                faceConfig.detection.isEnabled = document.getElementById("detection").checked;                  
                faceConfig.detection.maxTrackedFaces = maxTrackedFaces;
                var selects = document.getElementById("mode");

                // Set the tracking mode 2D/3D
                faceConfig.trackingMode = Number(selects.options[selects.selectedIndex].value);

                // Apply Face Configuration changes
                return faceConfig.applyChanges();
            }).then(function (result) {
                status('Init started');
                sense.onStatusChanged = onStatus;
                faceModule.onFrameProcessed = onFaceData;
                return sense.init();
            }).then(function (result) {
                if (sense.captureManager.device.deviceInfo.orientation == intel.realsense.DeviceOrientation.DEVICE_ORIENTATION_FRONT_FACING) {
                    // if current device is front facing

                    // Enable face landmarks, pose and expressions
                    faceConfig.landmarks.isEnabled = document.getElementById("landmarks").checked;
                    faceConfig.landmarks.maxTrackedFaces = maxTrackedFaces;
                    faceConfig.pose.isEnabled = document.getElementById("pose").checked;
                    faceConfig.expressions.properties.isEnabled = document.getElementById("expressions").checked;
                } else {
                    // if current device is R200

                    // Disable face landmarks, pose, expressions
                    faceConfig.landmarks.isEnabled = false;
                    faceConfig.pose.isEnabled = false;
                    faceConfig.expressions.properties.isEnabled = false;

                    document.getElementById("landmarks").checked = false;
                    document.getElementById("pose").checked = false;
                    document.getElementById("expressions").checked = false;
                }

                // Apply Face Configuration changes
                return faceConfig.applyChanges();
            }).then(function (result) {
                // Query image size 
                imageSize = sense.captureManager.queryImageSize(rs.StreamType.STREAM_TYPE_COLOR);

                // Start Streaming
                return sense.streamFrames();
            }).then(function (result) {
                status('Streaming ' + imageSize.width + 'x' + imageSize.height);
                document.getElementById("Stop").disabled = false;

                //initialize renderer
                if (scene == null) {
                    nodestorender = initFaceRenderer(imageSize.width, imageSize.height, maxTrackedFaces);
                }

            }).catch(function (error) {
                // handle pipeline initialization errors
                status('Init failed: ' + JSON.stringify(error));
                document.getElementById("Start").disabled = false;
            });
        });

        function onFaceData(sender, data) {

            // notify sample renderer
            if(data.faces.length == 0) clearFaceRendererData();

            // for every face in current frame
            for (f = 0; f < data.faces.length; f++) {

                // retrieve a face module instance
                var face = data.faces[f];

                // if face is not valid
                if (face == null) continue;

                // retrieve face detection data
                if (face.detection != null) {
                    if (face.detection.faceBoundingRect !== 'undefined') {

                        // retrieve face detection bounding rectangle
                        var rectangle = face.detection.boundingRect;

                        // update sample renderer rectangle dimensions
                        renderFaceDetection(rectangle.x * factor, rectangle.y * factor, rectangle.w * factor, rectangle.h * factor);

                    }
                }

                // retrieve face landmark points
                if (face.landmarks.points !== 'undefined') {
                    for (var i = 0; i < face.landmarks.points.length; i++) {
                        point = face.landmarks.points[i];
                        if (point != null) {

                            // update sample renderer landmarks position
                            nodestorender[f][i].position.set(point.image.x * factor, point.image.y * factor, 0);
                        }
                    }
                }

                if (face.pose !== 'undefined' && face.pose != null) {
                    $('#pose_status').text('Pose: ' + JSON.stringify(face.pose));
                } else {
                    $('#pose_status').text('');
                }
                if (face.expressions !== null && face.expressions.expressions != null) {
                    $('#myTable').find('tr:gt(0)').remove();
                    var exprs = face.expressions.expressions;
                    $.each(intel.realsense.face.ExpressionsData.FaceExpression, function(key, index) {
                        $('#myTable tr:last').after('<tr> <td>' + key + "</td> <td> +" + exprs[index].intensity + "</td></tr>");
                    });
                } else {
                    $('#expressions_status').text('');
                }
            }
        }

        // Clear Pose & Expression fields
        function clear() {
            $('#pose_status').text('');
            $('#expressions_status').text('');
            document.getElementById("Start").disabled = false;
            clearFaceRendererData();
        }

        $('#Stop').click(function () {
            document.getElementById("Stop").disabled = true;
            sense.release().then(function (result) {
                status('Stopped');
                sense =undefined;
                clear();
            });
        });

        function onStatus(sender, sts) {
            if (sts < 0) {
                status('Module error with status code: ' + sts);
                clear();
            }
        }

        function status(msg) {
            $('#status').text(msg);
        }
    });
}

$(document).ready(Start);

