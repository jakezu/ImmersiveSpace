engine.IncludeFile("local://class.js"); // from jsmodules/lib

var _p = null;
var _applicationName = "ImmersiveSpaceApplication";

var Server = Class.extend
({
    init: function()
    {
        if (me.name != _applicationName)
            me.name = _applicationName;

        this.data = {};

        Log("**** Creating server objects");

        // Create Void-entity which gives placeable data for the clients
        this.createVoidEntity();
        
        // Remove FreeLookCamera from the scene
        this.removeFreeLookCamera();
    },
	
	createVoidEntity: function()
	{
		voidentity = scene.CreateEntity(scene.NextFreeId(), /* NextFreeId() for replicated */
						["EC_Placeable", "EC_Camera"],      /* Components */
						'',                                 /* AttributeChange enum, 2 for LocalOnly, 3 for replicated. */
						replicated=true,                    /* Replicate entity to server and other clients */
						componentsReplicated=true);         /* Replicate components to server and other clients */

		voidentity.SetName("Void");
		voidentity.SetTemporary(true);
		voidentity.camera.SetActive();
		Log("**** Replicated server entity has been created with placeable component");
	},
	
	removeFreeLookCamera: function()
	{
		var freelookcamera = scene.GetEntityByName("FreeLookCamera");
		
		if (freelookcamera)
		{
			freelookcameraID = freelookcamera.Id();
			scene.RemoveEntity(freelookcameraID,'');
			Log("**** FreeLookCamera entity removed");
		}
	}
});

// Startup
_p = new Server();

// EOF
