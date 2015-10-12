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
   connection.send('Connection closed');
   socket = null;
   isopen = false;
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
        intel.realsense.SenseManager.detectPlatform(['voice', 'nuance_en_us_cnc'],[]).then(function (info) {
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
    var speech_rec;
    var sense;
    var rs = intel.realsense;
    $(window).bind("beforeunload", function (e) {
        if (speech_rec != undefined) {
            speech_rec.stopRec().then(function (result) {
                speech_rec.Release();
                speech_rec = undefined;
                if (sense != undefined) {
                    sense.release().then(function (result) {
                        sense = undefined;
                    });
                }
            });
        }
    })


    $('#Start').click(function () {
        document.getElementById("Start").disabled = true;
        rs.SenseManager.createInstance().then(function (result) {
            sense = result;
            status('Initialize SpeechRecognition module');
            return rs.speech.SpeechRecognition.createInstance(sense);
        }).then(function (result) {
            speech_rec = result;
            var commands = $('#commands').val().split(' ');
            return speech_rec.buildGrammarFromStringList(1, commands, null);              
        }).then(function (result) {
            return speech_rec.setGrammar(1);
        }).then(function (result) {
            status('Grammar created');
            speech_rec.onSpeechRecognized = OnRecognition;
            speech_rec.onAlertFired = OnAlert;
            return speech_rec.startRec();
        }).then(function (result) {
            status('Started');
            document.getElementById("Stop").disabled = false;
        }).catch(function (error) {
            status('StartRec failed: ' + JSON.stringify(error));
            document.getElementById("Start").disabled = false;
        });
    });

    $('#Stop').click(function () {
        document.getElementById("Stop").disabled = true;
        speech_rec.stopRec().then(function (result) {
            status('Stopped');
            $('#alerts').text('');
            $('#recognition').text('');
            speech_rec.release();
            speech_rec = undefined;
            if (sense != undefined) {
                sense.release().then(function (result) {
                    sense = undefined;
                });
            }
            document.getElementById("Start").disabled = false;
        });
    });

    function OnRecognition(sender, result) {
        var res = result.data.scores[0];

        connection.send('SPOKEN: ' + JSON.stringify(res));

        if (res.confidence !== 'undefined' && res.confidence != 0) res.sentence += ' (' + res.confidence + '%)';
        $('#recognition').append(res.sentence + '<br>');
        var obj = document.getElementById("recognition");
        obj.scrollTop = obj.scrollHeight;
    }

    function OnAlert(sender, result) {
        $('#alerts').append(result.data.name + '<br>');
        connection.send('SPOKEN-ALERT: ' + JSON.stringify(result.data.name));

        var obj = document.getElementById("alerts");
        obj.scrollTop = obj.scrollHeight;
    }


}



$(document).ready(Start);

