
CKCatalog.init_pen = function (){

  //log the parameter pushed into the html line
  var param1var = getQueryVariable("uuid");
  console.log("Parameter: " + param1var);

  if (param1var == null)
  {
    function generateUUID() {
      var d = new Date().getTime();
      if(window.performance && typeof window.performance.now === "function"){
          d += performance.now();; //use high-precision timer if available
      }
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (d + Math.random()*16)%16 | 0;
          d = Math.floor(d/16);
          return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });
      console.log("creating new pen: " + uuid);
      return uuid;
    };


    var zoneName = undefined;
    var recordName = generateUUID();
    var title = "untitled";

    var container = CloudKit.getDefaultContainer();
    var publicDB = container.publicCloudDatabase;

    // If no options are provided the record will be saved to the default zone.
    var options = zoneName ? { zoneID: zoneName } : undefined;

    var record = {
      recordName: recordName,

      recordType: 'BioPen',

      fields: {
        title: {
          value: title
        }
      }
    };

    publicDB.saveRecord(record,options)
    .then(function(response) {
      if(response.hasErrors) {

        // Handle the errors in your app.
        throw response.errors[0];

      } else {
        var createdRecord = response.records[0];
        var fields = createdRecord.fields;
        var molecule = fields['molecule'];
        var title = fields['title'];
        
        console.log("YourData = " + JSON.stringify(molecule) + "; Title = " + JSON.stringify(title));
      }
    });


    //now set url with the parameter
    document.location = document.location + "?udid="

  }
  else
  {
    //do a public fetch for the pen and its data contained
    console.log("Load Pen: " + param1var);  

    var container = CloudKit.getDefaultContainer();
    var publicDB = container.publicCloudDatabase;

    var query = {
      recordType: 'BioPen',
      recordName: param1var
    };

    publicDB.performQuery(query)
      .then(function (response) {
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
            records.forEach(function (record) {
              var fields = record.fields;
              
              console.log(record.recordType);
              console.log(record.recordName);
              console.log(fields['title'].value);
              console.log(fields['molecule'].value);

              //execute the search for the molecule
              
              // ---
              // TODO:
              // once we are saving use this value
              // fields['molecule'].value
              pubChem_compoundSearchByName("methanol", alphaDimension);
              // ---
            });
            return el;
          }
        }
      })


  }

  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
      for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
          return pair[1];
        }
      } 
    //alert('Query Variable ' + variable + ' not found');
  }

}