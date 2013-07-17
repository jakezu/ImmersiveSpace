engine.IncludeFile("local://class.js"); // from jsmodules/lib

var _p = null;
var voidentity = scene.GetEntityByName("Void");

var SlaveClient = Class.extend
({
	init: function()
	{

		Log("**** Creating slave client objects");

		this.createSlaveClient();
		this.setSlaveCamera();
		//this.setSpawnPoint();
		
		this.removeFreeLookCamera();
	},

	// Create SlaveClient-entity which gets placeable data from the server
	createSlaveClient: function()
	{
		slaveclient = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);

		slaveclient.SetName("SlaveClient");
		slaveclient.SetTemporary(true);
		var placeable = slaveclient.placeable;
		//var voidentity = scene.GetEntityByName("Void");
		
		// set parenting reference to the Server's Void-entity
		placeable.SetParent(voidentity, preserveWorldTransform=false);
		
		Log("**** SlaveClient entity has been created with placeable, camera and name components");
	},
	
	// Set SlaveCamera parameters
	setSlaveCamera: function()
	{
		var slavecamera = slaveclient.camera;
		var placeable = slaveclient.placeable;
		var transform = placeable.transform;
		
		// Field of vision (45 = default, 38.5 is good in one particular setup)
		slavecamera.verticalFov = 38.5;
		
		// Get client's ID number
		var regexp = /\d/;
		var ID = regexp.exec(client.LoginProperty("username"));
		//var ID = slaveClientID - 1;
		
		
		// Rotate camera by ID * 60 degrees (when rotated to clockwise, negative y-axis value is needed)
		transform.rot.y = -(ID-1) * 60;
		placeable.transform = transform;
		
		slavecamera.SetActive();
		
		Log("**** SlaveCamera has been set and rotated by " + (ID-1)*60 + " degrees clockwise");
		
	},
	
	// Remove FreeLookCamera from the scene
	removeFreeLookCamera: function()
	{
		var freelookcamera = scene.GetEntityByName("FreeLookCamera");
		
		if (freelookcamera)
		{
			scene.RemoveEntity(freelookcamera.id,'');
			Log("**** FreeLookCamera entity removed");
		}
	}	
	
});

// Startup
_p = new SlaveClient();

// EOF
