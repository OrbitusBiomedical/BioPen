
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

debugger;

    var zoneName = undefined;
    var recordName = generateUUID();
    var title = "title";
    var molecule = "ether";

    var container = CloudKit.getDefaultContainer();
var publicDB = container.publicCloudDatabase;

// If no options are provided the record will be saved to the default zone.
var options = zoneName ? { zoneID: zoneName } : undefined;

var record = {
  recordName: recordName,

  recordType: 'BioPen',

  fields: {
    molecule: {
      value: molecule
    },
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
    
    console.log("YourData = " + molecule + "; Title = " + title);
  }
});

  }
  else
  {
    console.log("Load Pen: " + param1var);  
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