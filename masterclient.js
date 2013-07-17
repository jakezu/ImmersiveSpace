engine.IncludeFile("local://class.js"); // from jsmodules/lib

var _p = null;
var voidentity = scene.GetEntityByName("Void");

var MasterClient = Class.extend
({
    init: function()
    {

        this.data = {};
		
        Log("**** Creating master client objects");

        this.createMasterClient();
		this.setMasterCamera();
		this.setSpawnPoint();
        
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

	// Set MasterCamera parameters
	setMasterCamera: function()
	{
		var mastercamera = masterclient.camera;
		
		// Field of vision (45 = default, 38.5 is good in one particular setup)
		mastercamera.verticalFov = 38.5;
		
		mastercamera.SetActive();

	},
	// Set initial spawn point
	setSpawnPoint: function()
	{
		var void_placeable = voidentity.placeable;
		var void_transform = void_placeable.transform;
		void_transform.pos = new float3(0, 20, 0);
		voidentity.placeable.transform = void_transform;
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
_p = new MasterClient();