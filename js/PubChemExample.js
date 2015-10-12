
var alphaObjects = [];
var alphaOpacity = 1.0;
var alphaDataResponse;
var alphaDataTitle;


var keyboard = new THREEx.KeyboardState();

var selectedDimension;
var selectedObjectsArray;


var alphaDimension;

var container, stats;
var camera, scene, renderer, effect, particles, geometry, materials = [], parameters, i, h, color, sprite, size;
var mouseX = 0, mouseY = 0;
var stereo = false;

var alphaTransformControl;

var objects = [];
var tmpVec1 = new THREE.Vector3();
var tmpVec2 = new THREE.Vector3();
var tmpVec3 = new THREE.Vector3();
var tmpVec4 = new THREE.Vector3();


var loader = new THREE.PubChem_3DJSONLoader();
var pdbLoader = new THREE.PDBLoader();

var colorSpriteMap = {};
var baseSprite = document.createElement( 'img' );

var rotateMolecules = true;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


if ( window.location !== window.parent.location ) {
  // The page is in an iframe
  console.log("The page is in an iframe");
  //only draw if the parameter asks us to force search field
  var searchFieldParam = getUrlVars()["searchField"];

  var drawSearchField = false;

  if ( typeof searchFieldParam !== 'undefined' && searchFieldParam != 'undefined' )
  	drawSearchField = true;

  if (drawSearchField)
  {
  	var searchContainer = document.getElementById("searchContainer");
  	searchContainer.style.display = "block";	
  }

} else {
  // The page is not in an iframe
  console.log("The page is not in an iframe");
  var searchContainer = document.getElementById("searchContainer");
  searchContainer.style.display = "block";

}


if ( ! Detector.webgl ) Detector.addGetWebGLMessage();


function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}



function process_pubChem_compoundSearch()
{
	console.log("begin pubChem compound Search - " + $("#field").val());
	pubChem_compoundSearchByName($("#field").val(), selectedDimension);
}


function pubChem_compoundSearchByName( searchTerm, destinationDimension)
{
	if (destinationDimension == alphaDimension)
	{
		alphaDataTitle = searchTerm;
	}
	

	var url = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/" + searchTerm + "/JSON?record_type=3d"; 
	var pubChemSearchHTTPRequest_json = new XMLHttpRequest(); 
	pubChemSearchHTTPRequest_json.open("GET", url, true);

	$.blockUI({
			message: '<h1>Searching...</h1>'
		});
    

	 // subscribe to this event before you send your request.
	pubChemSearchHTTPRequest_json.onreadystatechange=function()
	{
	 	if (pubChemSearchHTTPRequest_json.readyState==4)
	 	{
	 		//console.log('responseText json =', pubChemSearchHTTPRequest_json.responseText);
	   		var jsonResponse = JSON.parse(pubChemSearchHTTPRequest_json.responseText);
			//console.log('searchTerm json results =', jsonResponse);
			$.unblockUI();

			
			if (jsonResponse.Fault)
			{
				var searchErrorMessage = 'Search Error' + "\n" + jsonResponse.Fault.Code + "\n" + jsonResponse.Fault.Message;
				//console.log(searchErrorMessage);
				alert(searchErrorMessage);
			}
			else
			{
				if (jsonResponse)
				{
					//console.log('atoms - ' , jsonResponse.PC_Compounds[0].atoms);
					//console.log('bonds - ' , jsonResponse.PC_Compounds[0].bonds);
					//console.log('coords - ' , jsonResponse.PC_Compounds[0].coords);
					//console.log('cid - ' , jsonResponse.PC_Compounds[0].id.id.cid);
					if (!selectedDimension)
					{
						selectedDimension = alphaDimension;
						scene.add( alphaTransformControl );
					}
					console.log('mylog = ', jsonResponse.PC_Compounds[0]);

					loadPubChemMoleculeProperties( jsonResponse.PC_Compounds[0].id.id.cid , destinationDimension);
					loadPubChemMolecule(jsonResponse.PC_Compounds[0], destinationDimension);
				}
			}
			
	  	}

	}
	pubChemSearchHTTPRequest_json.send(null);
}


function checkField(){

	if($("#field").val() == "")
	{
		alert('Search Field is Empty, Search for molecules on PubChem by PuchChem index, name, or any other keyword you might use on PubChem!');
		return false;
	}

	str = $("#field").val();
	
	return false;
}



function setAtomSize( atom, element)
{
	//console.log('atom size -', atom.width, atom.height);
	//console.log('element -', element);
	switch(element)
	{
		case 6:
		//console.log('carbon');
		atom.width = 73;//picometers
		atom.height = 73;//picometers
		break;
		case 8:
		//console.log('oxygen');
		atom.width = 66;//picometers
		atom.height = 66;//picometers
		break;
		case 7:
		//console.log('nitrogen');
		atom.width = 71;//picometers
		atom.height = 71;//picometers
		break;
		case 1:
		//console.log('hydrogen');
		atom.width = 31;//picometers
		atom.height = 31;//picometers
		break;
	}
}

function getAtomSize(element)
{
	//console.log('element -', element);
	switch(element)
	{
		case 6:
		//console.log('carbon');
		return 73/2.0;//picometers
		break;
		case 8:
		//console.log('oxygen');
		return 66/2.0;//picometers
		break;
		case 7:
		//console.log('nitrogen');
		return 71/2.0;//picometers
		break;
		case 1:
		//console.log('hydrogen');
		return 31/2.0;//picometers
		break;
	}
}



function loadPubChemMoleculeProperties( cid , destinationDimension)
{
	//console.log('pubChem_3djson ', + cid);
	

	document.getElementById('MoleculeCID').innerHTML = cid;


	var url = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" + cid + "/JSON"; 
	var pubChemSearchHTTPRequest_json = new XMLHttpRequest(); 
	pubChemSearchHTTPRequest_json.open("GET", url, true);

	 // subscribe to this event before you send your request.
	pubChemSearchHTTPRequest_json.onreadystatechange=function()
	{
	 	if (pubChemSearchHTTPRequest_json.readyState==4)
	 	{
	 		//console.log('responseText json =', pubChemSearchHTTPRequest_json.responseText);
	   		var jsonResponse = JSON.parse(pubChemSearchHTTPRequest_json.responseText);
	   		
	   		if (destinationDimension == alphaDimension)
	   		{
	   			alphaDataResponse = jsonResponse;
	   		}
	   		

	   		parseDataResponseIntoInfoPanel(selectedDimension);
			
	  	}
	}
	pubChemSearchHTTPRequest_json.send(null);
}

function parseDataResponseIntoInfoPanel(selectedDimension)
{
	var jsonResponse;
	if (selectedDimension == alphaDimension)
	{
		jsonResponse = alphaDataResponse;
		document.getElementById('MoleculeName_MainLabel').innerHTML = alphaDataTitle;
		document.getElementById('MoleculeName').innerHTML = alphaDataTitle;
	}
	

	if (jsonResponse)
	{
   		if (jsonResponse.PC_Compounds)
   		{
   			//console.log('props =', jsonResponse.PC_Compounds[0].props); //0 because we only sent off 1 cid request...asyncronously btw	
   			for (var propIndex in jsonResponse.PC_Compounds[0].props)
   			{
   				var propertyObject = jsonResponse.PC_Compounds[0].props[propIndex];
   				

   				
   				if (propertyObject.urn.label == 'Count')
   				{	
   					if (propertyObject.urn.name == 'Rotatable Bond')
   					{
   						//console.log('property Object = ' + propertyObject.value.ival);		
						document.getElementById('RotatableBond').innerHTML = propertyObject.value.ival;
   					}
					if (propertyObject.urn.name == 'Hydrogen Bond Acceptor')
   					{
   						//console.log('property Object = ' + propertyObject.value.ival);		
						document.getElementById('HydrogenBondAcceptor').innerHTML = propertyObject.value.ival;
   					}
   					if (propertyObject.urn.name == 'Hydrogen Bond Donor')
   					{
   						//console.log('property Object = ' + propertyObject.value.ival);		
						document.getElementById('HydrogenBondDonor').innerHTML = propertyObject.value.ival;
   					}
   					
   					
   				}

   				if (propertyObject.urn.label == 'Molecular Weight')
   				{	
						//console.log('property Object = ' + propertyObject.value.fval);		
					document.getElementById('MolecularWeight').innerHTML = propertyObject.value.fval;
   				}
   				if (propertyObject.urn.label == 'Molecular Formula')
   				{	
						//console.log('property Object = ' + propertyObject.value.sval);		
					document.getElementById('MoleculeFormula').innerHTML = propertyObject.value.sval;
   				}
   				if (propertyObject.urn.label == 'IUPAC Name')
   				{	
   					if (propertyObject.urn.name == 'Preferred')
   					{
   						//console.log('MoleculeName = ' + propertyObject.value.sval);
						document.getElementById('IUPAC_PreferredName').innerHTML = propertyObject.value.sval;
   					}
   				}
   			}
   		}
	}
}


function loadPubChemMolecule( pubChem_3djson , destinationDimension)
{
	//------------
	// Clear out old objects from the DOM
	if (!destinationDimension)
	{
		console.log('Need destinationDimension... defaulting to alpha');
	}
	else
	{
		console.log("Loading molecule into destinationDimension - ", destinationDimension);	
		selectedDimension = destinationDimension;
	}
		

	clearSelectedDimensionObjects();

	//------------

	loader.pubChem_load( pubChem_3djson, function ( geometry, geometryBonds, order ) {
		


		var offset = THREE.GeometryUtils.center( geometry );
		geometryBonds.applyMatrix( new THREE.Matrix4().makeTranslation( offset.x, offset.y, offset.z ) );

		for ( var i = 0; i < geometry.vertices.length; i ++ ) {

			var position = geometry.vertices[ i ];
			var color = geometry.colors[ i ];
			//console.log('geometry -', geometry);
			//console.log('geometryBonds -', geometryBonds);
			//console.log('geometryColor -', color);

			var element = geometry.elements[ i ];
			
			//WebGL way of adding a sprite atom
			
			var geometry2 = new THREE.SphereGeometry( getAtomSize(element), 32, 32 );

			var material =  new THREE.MeshLambertMaterial( { color:color.getHex(), shading: THREE.FlatShading , transparent: true} );
			//var material = new THREE.MeshBasicMaterial( {color: color.getHex()} );
			var sphere = new THREE.Mesh( geometry2, material );



			material.opacity = 0.7;
			sphere.position.copy( position );
			sphere.position.multiplyScalar( 100 );
			

			selectedDimension.add( sphere );

			if (selectedDimension == alphaDimension)	
				alphaObjects.push( sphere );
			
			//console.log('round1');
		}

		for ( var i = 0; i < geometryBonds.vertices.length; i += 2 ) {

			var start = geometryBonds.vertices[ i ];
			var end = geometryBonds.vertices[ i + 1 ];

			start.multiplyScalar( 100 );
			end.multiplyScalar( 100 );

			tmpVec1.subVectors( end, start );
			var bondLength = tmpVec1.length();


			var axis = tmpVec2.set( 0, 1, 0 ).cross( tmpVec1 );
			var radians = Math.acos( tmpVec3.set( 0, 1, 0 ).dot( tmpVec4.copy( tmpVec1 ).normalize() ) );

			var objMatrix = new THREE.Matrix4().makeRotationAxis( axis.normalize(), radians );
				

			//console.log('geometryBonds = ', geometryBonds);
			//console.log('order = ', order[i]);
			//console.log('i =', i/2);


			switch (order[i/2])
			{
				case 1:
				{
					// One Bond
					//console.log('single bond rudy');
					var bond = document.createElement( 'div' );
					bond.className = "bond";
					bond.style.height = bondLength + "px";

					var bond2 = document.createElement( 'div' );
					bond2.className = "bond";
					bond2.style.height = bondLength + "px";

					var joint = new THREE.Object3D( bond );
					joint.position.copy( start );
					joint.position.lerp( end, 0.5 );

					joint.matrix.copy( objMatrix );
					joint.rotation.setFromRotationMatrix( joint.matrix, joint.rotation.order );

					joint.matrixAutoUpdate = false;
					joint.updateMatrix();


					var joint2 = new THREE.Object3D( bond2 );
					joint2.position.copy( start );
					joint2.position.lerp( end, 0.5 );

					joint2.matrix.copy( objMatrix );
					joint2.rotation.setFromRotationMatrix( joint2.matrix, joint2.rotation.order );

					joint2.matrixAutoUpdate = false;
					joint2.updateMatrix();



					var geometry = new THREE.CylinderGeometry( 4, 4, bondLength, 4, 1 );
					var material =  new THREE.MeshLambertMaterial( { color:0xffffff, shading: THREE.FlatShading, transparent: true } );
					var mesh = new THREE.Mesh( geometry, material );
	

					//var object = new THREE.CSS3DObject( bond );
					mesh.rotation.y = Math.PI/2;

					mesh.matrixAutoUpdate = false;
					mesh.updateMatrix();

					mesh.userData.bondLengthShort = bondLength + "px";
					mesh.userData.bondLengthFull = ( bondLength + 55 ) + "px";

					mesh.userData.joint = joint;

					joint.add( mesh );
					selectedDimension.add( joint );


					if (selectedDimension == alphaDimension)	
						alphaObjects.push( mesh );
					
					var geometry = new THREE.CylinderGeometry( 4, 4, bondLength, 4, 1 );
					var material =  new THREE.MeshLambertMaterial( { color:0xffffff, shading: THREE.FlatShading, transparent: true } );
					var mesh2 = new THREE.Mesh( geometry, material );

					//var object2 = new THREE.CSS3DObject( bond2 );
					//object2.rotation.y = Math.PI/2;
					mesh2.matrixAutoUpdate = false;
					mesh2.updateMatrix();

					mesh2.userData.bondLengthShort = bondLength + "px";
					mesh2.userData.bondLengthFull = ( bondLength + 55 ) + "px";

					mesh2.userData.joint = joint;

					joint2.add( mesh2 );
					selectedDimension.add( joint2 );


					if (selectedDimension == alphaDimension)	
						alphaObjects.push( mesh2 );
					
				}
				break;
				case 2:
				{
					// One Bond

					//console.log('double bond rudy');
					var bond = document.createElement( 'div' );
					bond.className = "bond";
					bond.style.height = bondLength + "px";

					var bond2 = document.createElement( 'div' );
					bond2.className = "bond";
					bond2.style.height = bondLength + "px";

					var joint = new THREE.Object3D( bond );
					joint.position.copy( start );
					joint.position.lerp( end, 0.5 );

					joint.matrix.copy( objMatrix );
					joint.rotation.setFromRotationMatrix( joint.matrix, joint.rotation.order );

					joint.matrixAutoUpdate = false;
					joint.updateMatrix();


					var joint2 = new THREE.Object3D( bond2 );
					joint2.position.copy( start );
					joint2.position.lerp( end, 0.5 );

					joint2.matrix.copy( objMatrix );
					joint2.rotation.setFromRotationMatrix( joint2.matrix, joint2.rotation.order );

					joint2.matrixAutoUpdate = false;
					joint2.updateMatrix();


					var geometry = new THREE.CylinderGeometry( 4, 4, bondLength, 4, 1 );
					var material =  new THREE.MeshLambertMaterial( { color:0xffffff, shading: THREE.FlatShading, transparent: true } );
					var object2 = new THREE.Mesh( geometry, material );								//object2.rotation.y = Math.PI/2;
					object2.position.x -= 10;
					object2.matrixAutoUpdate = false;
					object2.updateMatrix();

					object2.userData.bondLengthShort = bondLength + "px";
					object2.userData.bondLengthFull = ( bondLength + 55 ) + "px";

					object2.userData.joint = joint;

					joint2.add( object2 );
					selectedDimension.add( joint2 );

					if (selectedDimension == alphaDimension)	
						alphaObjects.push( object2 );
					

					// Another Bond

					var bond = document.createElement( 'div' );
					bond.className = "bond";
					bond.style.height = bondLength + "px";

					var bond2 = document.createElement( 'div' );
					bond2.className = "bond";
					bond2.style.height = bondLength + "px";

					var joint = new THREE.Object3D( bond );
					joint.position.copy( start );
					joint.position.lerp( end, 0.5 );

					joint.matrix.copy( objMatrix );
					joint.rotation.setFromRotationMatrix( joint.matrix, joint.rotation.order );

					joint.matrixAutoUpdate = false;
					joint.updateMatrix();


					var joint2 = new THREE.Object3D( bond2 );
					joint2.position.copy( start );
					joint2.position.lerp( end, 0.5 );

					joint2.matrix.copy( objMatrix );
					joint2.rotation.setFromRotationMatrix( joint2.matrix, joint2.rotation.order );

					joint2.matrixAutoUpdate = false;
					joint2.updateMatrix();


					var geometry = new THREE.CylinderGeometry( 4, 4, bondLength, 4, 1 );
					var material =  new THREE.MeshLambertMaterial( { color:0xffffff, shading: THREE.FlatShading, transparent: true } );
					var object2 = new THREE.Mesh( geometry, material );								//object2.rotation.y = Math.PI/2;
					//object2.rotation.y = Math.PI/2;
					object2.position.x += 10;
					object2.matrixAutoUpdate = false;
					object2.updateMatrix();

					object2.userData.bondLengthShort = bondLength + "px";
					object2.userData.bondLengthFull = ( bondLength + 55 ) + "px";

					object2.userData.joint = joint;

					joint2.add( object2 );
					selectedDimension.add( joint2 );


					if (selectedDimension == alphaDimension)	
						alphaObjects.push( object2 );
					
				}
				break;
				case 3:
				{
					// One Bond
					//console.log('triple bond rudy');
					var bond = document.createElement( 'div' );
					bond.className = "bond";
					bond.style.height = bondLength + "px";

					var bond2 = document.createElement( 'div' );
					bond2.className = "bond";
					bond2.style.height = bondLength + "px";

					var joint = new THREE.Object3D( bond );
					joint.position.copy( start );
					joint.position.lerp( end, 0.5 );

					joint.matrix.copy( objMatrix );
					joint.rotation.setFromRotationMatrix( joint.matrix, joint.rotation.order );

					joint.matrixAutoUpdate = false;
					joint.updateMatrix();


					var joint2 = new THREE.Object3D( bond2 );
					joint2.position.copy( start );
					joint2.position.lerp( end, 0.5 );

					joint2.matrix.copy( objMatrix );
					joint2.rotation.setFromRotationMatrix( joint2.matrix, joint2.rotation.order );

					joint2.matrixAutoUpdate = false;
					joint2.updateMatrix();

					var geometry = new THREE.CylinderGeometry( 4, 4, bondLength, 4, 1 );
					var material =  new THREE.MeshLambertMaterial( { color:0xffffff, shading: THREE.FlatShading, transparent: true } );
					var object2 = new THREE.Mesh( geometry, material );


					//object2.rotation.y = Math.PI/2;
					object2.matrixAutoUpdate = false;
					object2.updateMatrix();

					object2.userData.bondLengthShort = bondLength + "px";
					object2.userData.bondLengthFull = ( bondLength + 55 ) + "px";

					object2.userData.joint = joint;

					joint2.add( object2 );
					selectedDimension.add( joint2 );
					if (selectedDimension == alphaDimension)	
						alphaObjects.push( object2 );
					
					// One Bond

					var bond = document.createElement( 'div' );
					bond.className = "bond";
					bond.style.height = bondLength + "px";

					var bond2 = document.createElement( 'div' );
					bond2.className = "bond";
					bond2.style.height = bondLength + "px";

					var joint = new THREE.Object3D( bond );
					joint.position.copy( start );
					joint.position.lerp( end, 0.5 );

					joint.matrix.copy( objMatrix );
					joint.rotation.setFromRotationMatrix( joint.matrix, joint.rotation.order );

					joint.matrixAutoUpdate = false;
					joint.updateMatrix();


					var joint2 = new THREE.Object3D( bond2 );
					joint2.position.copy( start );
					joint2.position.lerp( end, 0.5 );

					joint2.matrix.copy( objMatrix );
					joint2.rotation.setFromRotationMatrix( joint2.matrix, joint2.rotation.order );

					joint2.matrixAutoUpdate = false;
					joint2.updateMatrix();



					var geometry = new THREE.CylinderGeometry( 4, 4, bondLength, 4, 1 );
					var material =  new THREE.MeshLambertMaterial( { color:0xffffff, shading: THREE.FlatShading, transparent: true } );
					var object2 = new THREE.Mesh( geometry, material );								//object2.rotation.y = Math.PI/2;
					object2.position.x -= 20;
					object2.matrixAutoUpdate = false;
					object2.updateMatrix();

					object2.userData.bondLengthShort = bondLength + "px";
					object2.userData.bondLengthFull = ( bondLength + 55 ) + "px";

					object2.userData.joint = joint;

					joint2.add( object2 );
					selectedDimension.add( joint2 );

					if (selectedDimension == alphaDimension)	
						alphaObjects.push( object2 );

					// Another Bond

					var bond = document.createElement( 'div' );
					bond.className = "bond";
					bond.style.height = bondLength + "px";

					var bond2 = document.createElement( 'div' );
					bond2.className = "bond";
					bond2.style.height = bondLength + "px";

					var joint = new THREE.Object3D( bond );
					joint.position.copy( start );
					joint.position.lerp( end, 0.5 );

					joint.matrix.copy( objMatrix );
					joint.rotation.setFromRotationMatrix( joint.matrix, joint.rotation.order );

					joint.matrixAutoUpdate = false;
					joint.updateMatrix();


					var joint2 = new THREE.Object3D( bond2 );
					joint2.position.copy( start );
					joint2.position.lerp( end, 0.5 );

					joint2.matrix.copy( objMatrix );
					joint2.rotation.setFromRotationMatrix( joint2.matrix, joint2.rotation.order );

					joint2.matrixAutoUpdate = false;
					joint2.updateMatrix();


					var geometry = new THREE.CylinderGeometry( 4, 4, bondLength, 4, 1 );
					var material =  new THREE.MeshLambertMaterial( { color:0xffffff, shading: THREE.FlatShading, transparent: true } );
					var object2 = new THREE.Mesh( geometry, material );
					object2.position.x += 20;
					object2.matrixAutoUpdate = false;
					object2.updateMatrix();

					object2.userData.bondLengthShort = bondLength + "px";
					object2.userData.bondLengthFull = ( bondLength + 55 ) + "px";

					object2.userData.joint = joint;

					joint2.add( object2 );
					selectedDimension.add( joint2 );

					if (selectedDimension == alphaDimension)	
						alphaObjects.push( object2 );
				}
			}
			

		}

		render();

	} );

}



$(document).ready(function() {  
    
	//----
	//pubChem_printJSON(2244); //Test that you can print from the server.... unit tests #1
	//----

	$('#searchContainer').focus();


	$('#pubChemSearchForm').submit(function () {
	 //console.log('userDidEnter in pubChemSearchForm');
	 process_pubChem_compoundSearch();
	 return false;
	});

    $('#submitButton').click(function() {
		//console.log('submit clicked - ' + $("#field").val());
		process_pubChem_compoundSearch();
	});

	$('#field').submit(function () {
		//sendContactForm();
		//console.log('Submit without refreshing');
		return false;
	});

    // if text input field value is not empty show the "X" button
	$("#field").keyup(function() {
		//console.log('search field keyup - ' + $("#field").val());
		$("#x").fadeIn();
		if ($.trim($("#field").val()) == "") {
			$("#x").fadeOut();
		}

	});
		// on click of "X", delete input field value and hide "X"
	$("#x").click(function() {
		//console.log('X clicked');
		$("#field").val("");
		$(this).hide();
	});


});  


$("field").focusin(function(){
    $(this).css("background-color","#FFFFCC");
	});
$("field").focusout(function(){
	$(this).css("background-color","#FFFFFF");
});


init();
animate();


function init() {

	container = document.getElementById('webgl_div');

	//camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
	//camera.position.z = 1000;
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );
	camera.position.z = 1500;




	scene = new THREE.Scene();
	var color = new THREE.Color();
	color.setRGB( 1, 1, 1 );
	scene.backgroundColor = color;
	

	scene.fog = new THREE.FogExp2( 0x000000, 0.00003 );
	
	var maxX = 660;
	var maxY = 400;


	var alphaMolecule = getUrlVars()["alpha"];
	//rotateMolecules = getUrlVars()["rotate"];

	var drawAlpha = false;

	if ( typeof alphaMolecule !== 'undefined' && alphaMolecule != 'undefined' )
		drawAlpha = true;
	
	console.log('rotateMolecules = ', rotateMolecules);


	alphaDimension = new THREE.Object3D();
	alphaDimension.position.x = -maxX;
	alphaDimension.position.y = maxY;

	alphaDimension.position.x = 0;
	alphaDimension.position.y = 0;
	
	scene.add( alphaDimension );


	selectedDimension = alphaDimension;
	selectedObjectsArray = alphaObjects;

	if (drawAlpha)
		pubChem_compoundSearchByName(alphaMolecule, alphaDimension);
	else
		pubChem_compoundSearchByName("ethanol", alphaDimension);

	// lights

	light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 );
	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( -1, -1, -1 );
	scene.add( light );

	light = new THREE.AmbientLight( 0x444444 );
	scene.add( light );

	light = new THREE.AmbientLight( 0x444444 );
	light.position.set( 0, 100, 0 );
	scene.add( light );

	

	renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x111111, 1 );

	container.appendChild( renderer.domElement );

	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : '`'.charCodeAt(0) });
	// CONTROLS

	//controls
	alphaTransformControl = new THREE.TransformControls( camera, renderer.domElement );
	alphaTransformControl.addEventListener( 'change', render );
	alphaTransformControl.attach( alphaDimension );
	

	window.addEventListener( 'keydown', function ( event ) {
	    //console.log(event.keyCode);

	    switch ( event.keyCode ) {
	      case 82: // R
	        alphaTransformControl.setMode( "rotate" );
	        break;
	      case 84: // T
	        alphaTransformControl.setMode( "translate" );
	        break;
		case 187:
		case 107: // +,=,num+
			alphaTransformControl.setSize( alphaTransformControl.size + 0.1 );
			break;
		case 189:
		case 10: // -,_,num-
			alphaTransformControl.setSize( Math.max(alphaTransformControl.size - 0.1, 0.1 ) );
			
			break;
	    }            
	});
	
	var stereoFieldParam = getUrlVars()["stereo"];


	if ( typeof stereoFieldParam !== 'undefined' && stereoFieldParam != 'undefined' )
	{
		stereo = true;
	}

	if (stereo)
	{
		controls = new THREE.DeviceOrientationControls( camera );	

		effect = new THREE.StereoEffect( renderer );
		effect.eyeSeparation = 10;
		effect.setSize( window.innerWidth, window.innerHeight );

	}
	else{

		controls = new THREE.TrackballControls( camera  , renderer.domElement);

		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.minDistance = 500.0;
		controls.maxDistance = 20000;

		controls.noZoom = false;
		controls.noPan = false;

		controls.staticMoving = false;
		controls.dynamicDampingFactor = 0.3;

		controls.keys = [ 65, 83, 68 ];

		controls.addEventListener( 'change', render );
	}

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	controls.handleResize();

//	renderer.setSize( window.innerWidth, window.innerHeight );
	effect.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

	mouseX = event.clientX - windowHalfX;
	mouseY = event.clientY - windowHalfY;

}

function onDocumentTouchStart( event ) {

	if ( event.touches.length === 1 ) {

		event.preventDefault();

		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;

	}

}

function onDocumentTouchMove( event ) {

	if ( event.touches.length === 1 ) {

		event.preventDefault();

		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;

	}

}


function clearSelectedDimensionObjects()
{
	//Clear the objects array
	if (selectedDimension == alphaDimension)
	{
		console.log('alpha clear, ', alphaObjects);
		for ( var i = 0; i < alphaObjects.length; i ++ ) {

			var object = alphaObjects[ i ];
			console.log('alpha clear object - ', alphaObjects);
			object.parent.remove( object );

		}
		alphaObjects = [];
		scene.add( alphaTransformControl );
	}
	
}


function animate() {

	requestAnimationFrame( animate );

	controls.update();

	render();
}

function render() {

	var time = Date.now() * 0.00005;

	if (rotateMolecules)
	{
		alphaDimension.rotation.y = time * -3.7;
	}

	alphaTransformControl.update();


	for ( i = 0; i < scene.children.length; i ++ ) {

		var object = scene.children[ i ];
		
		if ( object instanceof THREE.ParticleSystem ) {

			object.rotation.y = time * ( i < 4 ? i + 1 : - ( i + 1 ) );

		}

	}

	for ( i = 0; i < materials.length; i ++ ) {

		color = parameters[i][0];

		h = ( 360 * ( color[0] + time ) % 360 ) / 360;
		materials[i].color.setHSL( h, color[1], color[2] );

	}

	if (stereo)
	{
		effect.render( scene, camera );
	}
	else
	{
		renderer.render( scene, camera );
	}

}