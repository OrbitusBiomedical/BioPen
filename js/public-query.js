/*
Copyright (C) 2015 Apple Inc. All Rights Reserved.
See LICENSE.txt for this sample’s licensing information

Abstract:
Sample code for performing a location query for Items objects in the public database. Includes rendering helpers.
*/

CKCatalog.tabs['public-query'] = (function() {

  var renderItem = function (title, molecule, url, uuid, username, usericonlink, userprofilelink) {

    /*
    <div class="single-pen" data-slug-hash="wKWwrm">
      <div class="iframe-wrap loaded" style="position: relative;">
        <a href="http://orbitusbiomedical.github.io/BioPen/orbitus007/pen/wKWwrm" class="cover-link"></a>
        <iframe class="single-pen-iframe" id="iframe_embed_4995757" src="http://orbitusbiomedical.github.io/BioPen/orbitus007/pen/wKWwrm" data-slug-hash="wKWwrm" data-username="/orbitus007" allowtransparency="true" frameborder="0" scrolling="no" data-src="http://orbitusbiomedical.github.io/BioPen/orbitus007/pen/wKWwrm" sandbox="allow-scripts allow-pointer-lock allow-same-origin allow-forms">
        </iframe>
      </div>
      <div class="meta-group">
        <div class="user">
          <a href="/orbitus007">
            <img src="http://orbitusbiomedical.github.io/BioPen/orbitus007/usericon.png" alt width="20" height="20">
            Orbitus007
          </a>
        </div>
        <div class="stats">
          <a class="single-stat comments" href="http://orbitusbiomedical.github.io/BioPen/orbitus007/pen/details/wKWwrm">
          </a>
          <a class="single-stat views" href="http://orbitusbiomedical.github.io/BioPen/orbitus007/pen/details/wKWwrm">
          </a>
          <a class="single-stat loves" href="http://orbitusbiomedical.github.io/BioPen/orbitus007/pen/details/wKWwrm">
          </a>
        </div>
      </div>
    </div>
    */

    var pen = document.createElement('div');
    pen.className = 'single-pen';

    var group = document.createElement('div');
    group.className = 'group';
    group.id = 'pen-group';
    pen.appendChild(group);

    var iframewrap = document.createElement('div');
    iframewrap.className = 'iframe-wrap';
    iframewrap.classList.add('loaded');
    iframewrap.style.position = 'relative';
    group.appendChild(iframewrap);

    var coverlink = document.createElement('a');
    coverlink.className = 'cover-link';
    coverlink.href = url;
    iframewrap.appendChild(coverlink);

    var iframe = document.createElement('iframe');
    iframe.className = 'single-pen-iframe';
    iframe.src = url;
    iframe.setAttribute("date-slug-hash", uuid);
    iframe.setAttribute("date-username", username);
    iframe.setAttribute("date-src", url);
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("frameborder", "0");    
    iframe.setAttribute("scrolling", "no");       
    iframe.setAttribute("sandbox", "allow-scripts allow-pointer-lock allow-same-origin allow-forms");
    iframewrap.appendChild(iframe);


    var metagroup = document.createElement('div');
    metagroup.className = 'meta-group';
    group.appendChild(metagroup);

    var user = document.createElement('div');
    user.className = 'user';
    metagroup.appendChild(user);


    var user_link = document.createElement('a');
    user_link.href = userprofilelink;
    user.appendChild(user_link);


    var user_img = document.createElement('img');
    user_img.href = usericonlink;
    user_img.setAttribute("width", "20");
    user_img.setAttribute("height", "20");
    user_link.appendChild(user_img);

    user_link.innerHTML = username;

    return pen;

  };

  var render = function(title) {
    var content = document.createElement('div');
    var heading = document.createElement('h2');
    heading.textContent = title;
    content.appendChild(heading);
    return content;
  };

  var getUsersPosition = function() {
    return new CloudKit.Promise(function(resolve) {
      var fallbackToSF = function() {
        var location = {
          latitude: 37.7833,
          longitude: -122.4167
        };

        var html = '<h2>Unable to lookup location of client</h2>' +
          '<p>Using location of San Francisco instead: </p>' +
          '<ul>' +
            '<li><b>Latitude: </b>'+location.latitude+'</li>' +
            '<li><b>Longitude: </b>'+location.longitude+'</li>' +
          '</ul>';

        CKCatalog.dialog.show(html, {
          title: 'Continue',
          action: function() {
            CKCatalog.dialog.show('Executing…');
            resolve(location);
          }
        });
      };
      try {
        navigator.geolocation.getCurrentPosition(function(position) {
          var coordinates = position.coords;
          resolve({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          });
        }, fallbackToSF);
      } catch(e) {
        fallbackToSF();
      }
    });
  };

  var publicQuerySample = {
    title: 'performQuery',
    sampleCode: function demoPerformQuery() {
      var container = CloudKit.getDefaultContainer();
      var publicDB = container.publicCloudDatabase;



      var opts = {
        lines: 13 // The number of lines to draw
      , length: 28 // The length of each line
      , width: 14 // The line thickness
      , radius: 42 // The radius of the inner circle
      , scale: 1 // Scales overall size of the spinner
      , corners: 1 // Corner roundness (0..1)
      , color: '#000' // #rgb or #rrggbb or array of colors
      , opacity: 0.25 // Opacity of the lines
      , rotate: 0 // The rotation offset
      , direction: 1 // 1: clockwise, -1: counterclockwise
      , speed: 1 // Rounds per second
      , trail: 60 // Afterglow percentage
      , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
      , zIndex: 2e9 // The z-index (defaults to 2000000000)
      , className: 'spinner' // The CSS class to assign to the spinner
      , top: '50%' // Top position relative to parent
      , left: '50%' // Left position relative to parent
      , shadow: false // Whether to render a shadow
      , hwaccel: false // Whether to use hardware acceleration
      , position: 'absolute' // Element positioning
      }
      var target = document.getElementById('pen-group')
      var spinner = new Spinner(opts).spin(target);


      // Get the user's current geolocation.
      return getUsersPosition().then(function (position) {

        // position is an object containing keys 'latitude' and 'longitude'.

        // Set up a query that sorts results in ascending distance from the
        // user's location.
        var query = {
          recordType: 'BioPen',
          sortBy: [{
            fieldName: 'title'
          }]
        };

        // Execute the query.
        return publicDB.performQuery(query)
          .then(function (response) {

            //Delete old PenGroup
            var pengroup = document.getElementById("pen-group");
            pengroup.parentNode.removeChild(pengroup);

            if(response.hasErrors) {

              // Handle them in your app.
              throw response.errors[0];

            } else {
              var records = response.records;
              var numberOfRecords = records.length;
              if (numberOfRecords === 0) {
                return render('No matching items')
              } else {
                console.log('Found ' + numberOfRecords + ' matching item'
                  + (numberOfRecords > 1 ? 's' : ''));
                
                spinner.stop();

                records.forEach(function (record) {
                  var fields = record.fields;

                  console.log(fields['title'].value);
                  console.log(fields['molecule'].value);
                  //console.log(fields['uuid'].value);

                  var tempUpdatedURL = fields['url'].value + "?alpha=" + fields['molecule'].value;

                  //Make new PenGroup
                  var pens_element = document.getElementById("picks-pens-grid");
                  pens_element.insertBefore(renderItem(fields['title'].value, fields['molecule'].value, tempUpdatedURL, fields['uuid'].value, fields['username'].value, fields['usericonlink'].value, fields['userprofilelink'].value), pens_element.childNodes[0] );
                    
                });
              }
            }
          })
      });
    }
  };

  return [ publicQuerySample ];

})();