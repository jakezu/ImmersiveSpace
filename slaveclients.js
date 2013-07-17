engine.IncludeFile("local://class.js"); // from jsmodules/lib

var _p = null;
var voidentity = scene.GetEntityByName("Void");

var SlaveClient = Class.extend
({
	init: function()
	{

		Log("**** Creating slave client objects");

		this.createSlaveClient();
		//this.setMasterCamera();
		//this.setSpawnPoint();
		
		this.removeFreeLookCamera();
	},

	// Create MasterClient-entity which gives placeable data for the clients
	createMasterClient: function()
	{
		masterclient = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);

		masterclient.SetName("MasterClient");
		masterclient.SetTemporary(true);
		var placeable = masterclient.placeable;
		//var voidentity = scene.GetEntityByName("Void");
		
		// set parenting reference to the Server's Void-entity
		placeable.SetParent(voidentity, preserveWorldTransform=false);
		
		Log("**** MasterClient entity has been created with placeable, camera and name components");
	},
	
});

// Startup
_p = new SlaveClient();