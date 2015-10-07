/*
Copyright (C) 2015 Apple Inc. All Rights Reserved.
See LICENSE.txt for this sample’s licensing information

Abstract:
The first use of the CloudKit namespace should be to set the configuration parameters.
*/

/**
 * This function is run immediately after CloudKit has loaded.
 */
CKCatalog.init = function() {
  try {

    // Configure CloudKit for your app.
    CloudKit.configure({
      containers: [{

        // Change this to a container identifier you own.
        containerIdentifier: 'iCloud.com.orbitusbiomedical.biopen',

        // And generate an API token through CloudKit Dashboard.
        apiToken: '65320202eeda0fe5d56b1e34366e950ab8d11770a06ce2b50d38cfeed3b8717b',

        auth: {
          // Set a cookie when running on http(s) and a hostname that is either localhost or
          // has at least one subdomain.
          persist: true
        },

        environment: 'development'
      }]
    });

    var failAuth = function(ckError) {
      var span = document.getElementById('username');
      span.textContent = 'Not Authenticated';

      var error = ckError;
      if(ckError.ckErrorCode === 'AUTHENTICATION_FAILED') {
        error = new Error(
          'Please check that you have a valid container identifier and API token in your configuration.'
        );
      }

      CKCatalog.dialog.showError(error);
    };
    // Try to run the authentication code.
    CKCatalog.tabs['authentication'][0].sampleCode().catch(failAuth);
    CKCatalog.tabs['public-query'][0].sampleCode();


    intel.realsense.SenseManager.detectPlatform(['hand'], ['front']).then(function (info) {
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



  } catch (e) {
    CKCatalog.dialog.showError(e);
  }
};



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
