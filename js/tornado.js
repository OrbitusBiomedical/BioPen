
/*
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2013 (three.js v59dev)
 */

// MAIN

// standard global variables
var container, scene, camera, renderer, effect, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var mesh;
var mesh_falling = false;
var mesh_raising = true;
var lastFrameTime = new Date().getTime() / 1000;
var totalGameTime = 0;
var dt;
var currTime;

var V = new THREE.Vector3(0.0,0.1,0.1);
var M = 1;
var S = new THREE.Vector3(100,0,100);
var B = new THREE.Vector3(0,.1,0);

var geometry;
var material;

var stereo = false;
var deviceOrientation = false;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


var stereoFieldParam = getUrlVars()["stereo"];
if ( typeof stereoFieldParam !== 'undefined' && stereoFieldParam != 'undefined' )
{
	stereo = true;		
}
var deviceOrientationFieldParam = getUrlVars()["deviceOrientation"];
if ( typeof deviceOrientationFieldParam !== 'undefined' && deviceOrientationFieldParam != 'undefined' )
{
	deviceOrientation = true;
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

init();
animate();

// FUNCTIONS 		
function init() 
{
	// SCENE
	
	scene = new THREE.Scene();
	var color = new THREE.Color();
	color.setRGB( 1, 0, 1 );
	scene.backgroundColor = color;
	



	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	camera.zoom = 1;
	scene.add(camera);
	camera.position.set(0,150,400);
	camera.lookAt(scene.position);	
	// RENDERER
	
	renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x111111, 1 );

	/*
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	*/
	container = document.getElementById( 'ThreeJS' );
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS

	if (deviceOrientation)
	{
		controls = new THREE.DeviceOrientationControls( camera );		
	}
	else
	{
		controls = new THREE.OrbitControls( camera, renderer.domElement );	
	}

	
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(100,250,100);
	scene.add(light);
	
	// SKYBOX
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);
	
	////////////
	// CUSTOM //
	////////////
	
	geometry = new THREE.SphereGeometry( 1, 32, 16 );
	material = new THREE.MeshLambertMaterial( { color: 0x000088 } );
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.set(0,100,100);
	scene.add(mesh);
	
	var axes = new THREE.AxisHelper(50);
	axes.position = mesh.position;
	scene.add(axes);
	
	var gridXZ = new THREE.GridHelper(100, 10);
	gridXZ.setColors( new THREE.Color(0x006600), new THREE.Color(0x006600) );
	gridXZ.position.set( 100,0,100 );
	scene.add(gridXZ);
	
	var gridXY = new THREE.GridHelper(100, 10);
	gridXY.position.set( 100,100,0 );
	gridXY.rotation.x = Math.PI/2;
	gridXY.setColors( new THREE.Color(0x000066), new THREE.Color(0x000066) );
	scene.add(gridXY);

	var gridYZ = new THREE.GridHelper(100, 10);
	gridYZ.position.set( 0,100,100 );
	gridYZ.rotation.z = Math.PI/2;
	gridYZ.setColors( new THREE.Color(0x660000), new THREE.Color(0x660000) );
	scene.add(gridYZ);
	
	// direction (normalized), origin, length, color(hex)
	var origin = new THREE.Vector3(0,0+100,0+100);
	var terminus  = new THREE.Vector3(B.x+100, B.y+100, B.z+100);
	var direction = new THREE.Vector3().subVectors(terminus, origin).normalize();
	var arrow = new THREE.ArrowHelper(direction, origin, 100, 0x884400);
	scene.add(arrow);
	
	
	if (stereo)
	{
		effect = new THREE.StereoEffect( renderer, deviceOrientation );
		effect.eyeSeparation = 2;
		effect.setSize( window.innerWidth, window.innerHeight );
	}

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	if (deviceOrientation)
	{

	}
	else
	{
		controls.handleResize();
	}

	if (stereo)
	{
		effect.setSize( window.innerWidth, window.innerHeight );
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
	else
	{
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
}

function animate() 
{
    requestAnimationFrame( animate );
	render();		
	update();
}


function update()
{

	currTime = new Date().getTime() / 1000;
    dt = currTime - (lastFrameTime || currTime);
    //console.log(dt);
    totalGameTime += dt;
	lastFrameTime = currTime;

	var F = new THREE.Vector3(0,0,0);
	var A = new THREE.Vector3(0,0,0);
	var Vnew = new THREE.Vector3(0,0,0); //Velocity at t+dt
	var Snew = new THREE.Vector3(0,0,0); //Position at t+dt
	var Vcurrent = new THREE.Vector3(0,0,0);
	var G = new THREE.Vector3(0.0,-0.01,0.0);
	var Gravity = new THREE.Vector3(0.0, 0.1,0.0);
	Vcurrent.copy(V);

	if (S.x-100 < 1 && S.z-100 < 1 && mesh_falling == true)
	{
		A.x = 0;
		A.y = 0;
		A.z = 0;
		mesh_falling = false;
		if (mesh_raising == false)
		{
			V.x = 0.1 + Math.floor((Math.random() * 10) + 1) * 0.1;
			V.y = 0;
			V.z = 0.1 + Math.floor((Math.random() * 10) + 1) * 0.1;
			mesh_raising = true;
		}
	}

   	if (S.y > 140.0 && mesh_falling == false)
   		mesh_falling = true;
   	

	if (!mesh_falling)
	{
		F.crossVectors( V , B); 			// F = (VxB)
		F.addVectors(F, G);
	}	
	else
	{

		if (mesh.position.y > 0)
		{
			F.addVectors(F, Gravity)
		}
		else
		{
			V = new THREE.Vector3(100-mesh.position.x,0,100-mesh.position.z);
			V.normalize();
		}
	}
	
	F.multiplyScalar(-1); //negative charge
	//F.multiplyScalar(M); //just 1
	A.copy(F) 	// A = F/M
	
	A.multiplyScalar(dt*50)

	Vnew.addVectors(V, A);
	//Vnew.multiplyScalar(dt*80)
	S.add(Vnew);
	
	Snew.copy(S);
	V.copy(Vnew);   	

   	mesh.position.x = Snew.x;
   	mesh.position.y = Snew.y;
   	mesh.position.z = Snew.z;
	
	//mesh = new THREE.Mesh( geometry, material );
	//mesh.position.set(Snew.x,Snew.y,Snew.z);
	//scene.add(mesh);

	
	if ( keyboard.pressed("z") ) 
	{	// do something   
		V = new THREE.Vector3(0,0.1,0.1);
		S.x = 100;
		S.y = 0;
		S.z = 100;
		Snew.x = 100;
		Snew.y = 100;
		Snew.z = 100;
		A.x = 0;
		A.y = 0;
		A.z = 0;
		lastFrameTime = new Date().getTime() / 1000;
	}
	
	console.log('(' + Snew.x + "," + Snew.y + "," + Snew.z );


	controls.update();
	stats.update();


}

function render() 
{
	//renderer.render( scene, camera );

	
	if (stereo)
	{
		effect.render( scene, camera );
	}
	else
	{
		renderer.render( scene, camera );
	}

	//renderer.render( scene, camera );
}

