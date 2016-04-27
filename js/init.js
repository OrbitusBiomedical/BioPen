



/*
Copyright (C) 2015 Apple Inc. All Rights Reserved.
See LICENSE.txt for this sample’s licensing information

Abstract:
The first use of the CloudKit namespace should be to set the configuration parameters.
*/



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

CKCatalog.isPalindrome = function (str) {
  for (var x = 0; x < ((str.length % 2 == 0) ? str.length/2 : (str.length-1)/2); x++)
  {
      if (str.charAt(x) !== str.charAt(str.length-1-x))
      {
        return false;
      }
  }
  return true;
}

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

    //TODO: separate init.js for an init_pen.js and init_home.js
    //THIS LINE DOES NOT NEED TO LOAD FOR THE pen.html only for the Index.html
    CKCatalog.tabs['public-query'][0].sampleCode();

    
  } catch (e) {
    CKCatalog.dialog.showError(e);
  }
};


