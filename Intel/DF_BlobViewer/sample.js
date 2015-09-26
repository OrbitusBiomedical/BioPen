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
    $("#checkok").hide(2000, function () {
        $("#privacy").show(1000);
    });
}
function status(msg) {
    $('#status').text(msg);
}

function Start() {
    $("div").hide();
    $("#check").show(500, function () {
        // check platform compatibility
        intel.realsense.SenseManager.detectPlatform(['blob'], []).then(function (info) {
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
                $('#fail').append('Please upgrade your camera driver from your computer manufactor.');
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
    var sense = undefined;
    $(window).bind("beforeunload", function (e) {
        if (sense != undefined) {
            sense.release().then(function (result) {
                sense = undefined;
            });
        }
    });

    $(document).ready(function () {        
        var imageSize;
        var blobModule;
        var rs = intel.realsense;

        // Pause the module when the page goes out of view
        $(document).bind(visChangeEvent, function() {
            if (sense !== undefined && blobModule !== undefined) {
                if (document[hiddenObj]) {
                    blobModule.pause(true);
                }
                else {
                    blobModule.pause(false);
                }
            }
        });

        $('#Start').click(function () {
            document.getElementById("Start").disabled = true;
            rs.SenseManager.createInstance().then(function (result) {
                sense = result;
                return rs.blob.BlobModule.activate(sense);
            }).then(function (result) {
                blobModule = result;
                return blobModule.createActiveConfiguration();
            }).then(function (result) {
                blobConfig = result;
                blobConfig.maxBlobs = rs.blob.MAX_NUMBER_OF_BLOBS;
                return blobConfig.applyChanges();
            }).then(function (result) {
                status('Init started');
                sense.onDeviceConnected = onConnect;
                sense.onStatusChanged = onStatus;
                blobModule.onFrameProcessed = onBlobData;
                return sense.init();
            }).then(function (result) {
                imageSize = sense.captureManager.queryImageSize(rs.StreamType.STREAM_TYPE_DEPTH);  
                return sense.streamFrames();
            }).then(function (result) {
                status('Streaming ' + imageSize.width + 'x' + imageSize.height);
                document.getElementById("Stop").disabled = false;
            }).catch(function (error) {
                status('Init failed: ' + JSON.stringify(error));
                document.getElementById("Start").disabled = false;
            });
        });

        function clear() {
            $('#blobs_status').text('');
            document.getElementById("Start").disabled = false;
            var canvas = document.getElementById('myCanvas');
            var context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        $('#Stop').click(function () {
            document.getElementById("Stop").disabled = true;
            sense.release().then(function (result) {
                sense = undefined;
                status('Stopped');                
                clear();
            });
        });

        function onBlobData(sender, blobData) {
            if (blobData == null) return;

            var canvas = document.getElementById('myCanvas');
            var context = canvas.getContext('2d');
            canvas.width = imageSize.width;
            canvas.height = imageSize.height;

            var blobs = blobData.queryBlobs(rs.blob.SegmentationImageType.SEGMENTATION_IMAGE_DEPTH, rs.blob.AccessOrderType.ACCESS_ORDER_NEAR_TO_FAR);
            if (blobs == null || blobs.length == 0) return;

            for (b = 0; b < blobs.length; b++) {
                var iblob = blobs[b];
                if (iblob == null) continue;

                var contours = iblob.queryContours();
                if (contours != null) {
                    for (j = 0; j < contours.length; j++) {
                        var icontour = contours[j];
                        var contourPoints = icontour.queryPoints();
                        if (contourPoints == null) continue;
                        for (i = 0; i < contourPoints.length; i++) {
                            var x = contourPoints[i].x;
                            var y = contourPoints[i].y;
                            context.beginPath();
                            context.arc(x, y, 2, 0, 2 * Math.PI);
                            context.lineWidth = 2;
                            context.strokeStyle = 'blue';
                            context.stroke();
                        }
                    }
                }

                for (j = 0; j < iblob.extremityPoints.length; j++) {
                    var extremityPoint = iblob.extremityPoints[j];
                    if (extremityPoint == null) continue;
                    context.beginPath();
                    context.arc(extremityPoint.x, extremityPoint.y, 2, 0, 2 * Math.PI);
                    context.lineWidth = 2;
                    context.strokeStyle = 'red';
                    context.stroke();
                }
            }
        }

        function onConnect(sender, connected) {
            if (connected == true) {
                $('#blobs_status').append('Connect with device instance: ' + sender.instance + '<br>');
            }
        }

        function onStatus(sender, sts) {
            if (sts < 0) {
                status('Module error with status code: ' + sts);
                clear();
            }
        }

    });
};


$(document).ready(Start);

