var _serverInstance = null;
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
    },x
	
	createVoidEntity: function()
	{
		var voidEntity = scene.CreateEntity(scene.NextFreeId(), /* NextFreeId() for replicated */
						["EC_Placeable", "EC_Camera"],      	/* Components */
						'',                                 	/* AttributeChange enum, 2 for LocalOnly, 3 for replicated. */
						replicated=true,                    	/* Replicate entity to server and other clients */
						componentsReplicated=true);         	/* Replicate components to server and other clients */

		voidEntity.SetName("Void");
		voidEntity.SetTemporary(true);
		voidEntity.camera.SetActive();
		Log("**** Replicated server entity has been created with placeable component");
	},
	
	removeFreeLookCamera: function()
	{
		var freeLookCamera = scene.GetEntityByName("FreeLookCamera");
		
		if (freeLookCamera)
		{
			freeLookCameraID = freeLookCamera.Id();
			scene.RemoveEntity(freeLookCameraID,'');
			Log("**** FreeLookCamera entity removed");
		}
	}
});

// Startup
_serverInstance = new Server();

// EOF