engine.IncludeFile("local://class.js"); // from jsmodules/lib
engine.ImportExtension("qt.core");
engine.ImportExtension("qt.gui");
engine.ImportExtension("qt.webkit");

var _p = null;
var sector = 1;
var voidentity = scene.GetEntityByName("Void");

var _g =
{
	connected : false,
	rotate :
	{
		sensitivity : 0.3
	},
	move :
	{
		sensitivity : 20.0,
		amount : new float3(0,0,0)
	},
	motion : new float3(0,0,0),
};


var MasterClient = Class.extend
({
	init: function()
	{

		// Connect frame updates and enabled inputmapper
		frame.Updated.connect(this, this.Update);
		
		this.data = {};
		
		Log("**** Creating master client objects");

		this.removeFreeLookCamera();
		this.createMasterClient();
		this.setMasterCamera();
		this.setSpawnPoint();
		this.createInputHandler();
		this.createHUD();

	},
	
	Update: function(frametime)
	{
		profiler.BeginBlock("FreeLookCamera_Update");

		if (_g.move.amount.x == 0 && _g.move.amount.y == 0 && _g.move.amount.z == 0)
		{
			profiler.EndBlock();
			return;
		}

		_g.motion.x = _g.move.amount.x * _g.move.sensitivity * frametime;
		_g.motion.y = _g.move.amount.y * _g.move.sensitivity * frametime;
		_g.motion.z = _g.move.amount.z * _g.move.sensitivity * frametime;
		
		_g.motion = voidentity.placeable.Orientation().Mul(_g.motion);
		voidentity.placeable.SetPosition(voidentity.placeable.Position().Add(_g.motion));

		profiler.EndBlock();
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
	
	// Create handler for keyboard and mouse events
	createInputHandler: function()
	{
		var inputContext = input.RegisterInputContextRaw("FreeLookCamera", 101);
		inputContext.takeMouseEventsOverQt = true;
		inputContext.KeyPressed.connect(this, this.HandleMove);
		inputContext.KeyReleased.connect(this, this.HandleStop);
		inputContext.MouseEventReceived.connect(this, this.HandleMouse);
		Log("**** InputHandler initialized...");
	},
	
	// Handler for key press commands 
	HandleMove: function(e)
	{
		var radians = (sector-1)*60*Math.PI/180;
		
		// forward
		if (e.keyCode == Qt.Key_W)
		{
			//_g.move.amount.z = -1;
			_g.move.amount.z = -Math.cos(radians);
			_g.move.amount.x = Math.sin(radians);
		}
		
		// backward
		else if (e.keyCode == Qt.Key_S)
		{
			//_g.move.amount.z = 1;
			_g.move.amount.z = Math.cos(radians);
			_g.move.amount.x = -Math.sin(radians);
		}
		
		// right
		else if (e.keyCode == Qt.Key_D)
		{
			//_g.move.amount.x = 1;
			_g.move.amount.z = Math.sin(radians);
			_g.move.amount.x = Math.cos(radians);
		}
		
		// left
		else if (e.keyCode == Qt.Key_A)
		{
			//_g.move.amount.x = -1;
			_g.move.amount.z = -Math.sin(radians);
			_g.move.amount.x = -Math.cos(radians);
		}
		
		// up
		else if (e.keyCode == Qt.Key_Space)
			_g.move.amount.y = 1;
		
		// down
		else if (e.keyCode == Qt.Key_C)
			_g.move.amount.y = -1;
		
		// change sector +
		else if (e.keyCode == Qt.Key_Plus)
		{
			if (sector < 6)
				sector++;
			else
				sector = 1;
			//Log("**** sector: " + sector);
		}
		
		// change sector -
		else if (e.keyCode == Qt.Key_Plus)
		{
			if (sector > 1)
				sector--;
			else
				sector = 6;
			//Log("**** sector: " + sector);
		}		
	},
	
	// Handler for key release commands
	HandleStop: function(e)
	{
	
	//if (e.keyCode == Qt.Key_W && _g.move.amount.z == -1)
	if (e.keyCode == Qt.Key_W && _g.move.amount.z != 0 )
		_g.move.amount = new float3(0,0,0);
	
	//else if (e.keyCode == Qt.Key_S && _g.move.amount.z == 1)
	else if (e.keyCode == Qt.Key_S && _g.move.amount.z != 0)
		_g.move.amount = new float3(0,0,0);
	
	//else if (e.keyCode == Qt.Key_D && _g.move.amount.x == 1)
	else if (e.keyCode == Qt.Key_D && _g.move.amount.x != 0)
		_g.move.amount = new float3(0,0,0);
		
	//else if (e.keyCode == Qt.Key_A && _g.move.amount.x == -1)
	else if (e.keyCode == Qt.Key_A && _g.move.amount.x != 0)
		_g.move.amount = new float3(0,0,0);
	
	//else if (e.keyCode == Qt.Key_Space && _g.move.amount.y == 1)
	else if (e.keyCode == Qt.Key_Space && _g.move.amount.y != 0)
		_g.move.amount = new float3(0,0,0);
		
	//else if (e.keyCode == Qt.Key_C && _g.move.amount.y == -1)
	else if (e.keyCode == Qt.Key_C && _g.move.amount.y != 0)
		_g.move.amount = new float3(0,0,0);
	},

	// Handler for mouse events
	HandleMouse: function(e)
	{
		if (e.IsButtonDown(2) && !input.IsMouseCursorVisible())
		{
			if (e.relativeX != 0)
				this.HandleMouseLookX(e.relativeX);
			if (e.relativeY != 0)
				this.HandleMouseLookY(e.relativeY);
		}
	},

	// Handler for mouse x axis relative movement
	HandleMouseLookX: function(param)
	{
		var transform = voidentity.placeable.transform;
		transform.rot.y -= _g.rotate.sensitivity * parseInt(param);
		voidentity.placeable.transform = transform;
	},

	// Handler for mouse y axis relative movement
	HandleMouseLookY: function(param)
	{
		var transform = voidentity.placeable.transform;
		var radians = (sector-1)*60*Math.PI/180;
		//transform.rot.x -= _g.rotate.sensitivity * parseInt(param);
		transform.rot.x -= _g.rotate.sensitivity * parseInt(param);
		//transform.rot.y += _g.rotate.sensitivity * parseInt(param);
		//_g.move.amount.z = -Math.cos(radians);
		if (transform.rot.x > 90.0)
			transform.rot.x = 90.0;
		if (transform.rot.x < -90.0)
			transform.rot.x = -90.0;
		voidentity.placeable.transform = transform;
	},
	
	createHUD: function()
	{
		var uiplane = renderer.CreateUiPlane("HUD");
		//uiplane.SetTexture(asset.GetAsset("compassb.png"));
		uiplane.SetTexture(asset.GetAsset("HiRes2.png"));
		//uiplane.SetTexture(asset.GetAsset("Compass_Rose.jpg"));
		uiplane.Show();
		uiplane.SetWidth(200, true);
		uiplane.SetHeight(200, true);	
		uiplane.SetRotation(45);
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

// EOF
