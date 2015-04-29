engine.ImportExtension("qt.core");
engine.ImportExtension("qt.gui");
engine.ImportExtension("qt.webkit");

// Globals, etc and their initial values
var _masterClientInstance = null;
var masterClient; // MasterClient entity
var masterCamera; // Camera component of MasterClient entity
var masterTransform; // Variable for transform function of Master Client's placeable component
var DEFAULT_SECT = 1; // Global value for sector of direction of travel
var DEFAULT_FOV = 38.5; // Global value for Field of vision (45 = default, 38.5 is good in one particular setup)
var DEFAULT_DIR = 0; // Global value for direction of travel
var DEFAULT_BEAR = 0.0; // Global value for bearing
var DEFAULT_AZM = 0.0; // Global value for azimuth
var DEFAULT_ALT = 20; // Global value for altitude
var DEFAULT_POS = new float3(0, DEFAULT_ALT, 0); //Global value for spawn point position of Void-entity
var DEFAULT_ROT = new float3(0, DEFAULT_AZM, 0); //Global value for spawn point rotation of Void-entity
var sector = DEFAULT_SECT; // Set initial value for sector of direction of travel
var fov = DEFAULT_FOV; // Set initial value of fov
var direction = DEFAULT_DIR; // Set initial value of direction of travel
var bearing = DEFAULT_BEAR; // Set initial value of bearing
var azimuth = DEFAULT_AZM; // Set initial value of azimuth
var altitude = DEFAULT_ALT; // Set initial value of altitude
var voidEntity = scene.GetEntityByName("Void"); // Gets 'Void' entity
var voidTransform; // Variable for transform function of Void's placeable component
var compass = new QPixmap(); // Qt Compass object
var needle = new QPixmap(); // Qt Needle object of Compass
var mainWidget = new QWidget(); // Info layout widget for showing additional information
var widget1 = new QLabel(); // Info widget #1
var widget2 = new QLabel(); // Info widget #2
var widget3 = new QLabel(); // Info widget #3
var widget4 = new QLabel(); // Info widget #4
var widget5 = new QLabel(); // Info widget #5
var infoWidgetProxy; // Info widget proxy layer
var helperWidgetProxy; // Helper widget proxy layer
var block_size = 0; // Letter box initial size
var block_left = new QGraphicsPolygonItem(); // Left letter box
var block_right = new QGraphicsPolygonItem(); // Right letter box
var mouselook = false; // Mouse look default boolean value
var arrow3D; // 3D arrow entity
var arrow3DTransform; // Variable for transform function of 3D Arrow's placeable component
var DEFAULT_A3D_POS = new float3(0,-0.9,-3); // Initial value of 3D Arrow's position
var DEFAULT_A3D_ROT = new float3(0,-90,0); // Initial value of 3D Arrow's rotation
var DEFAULT_A3D_SA = new float3(0.1,0.01,0.1); // Initial value of 3D Arrow's scale
var radians; // Variable for trigonometric calculations
 

var _g =
{
	connected : false,
	rotate :
	{
		sensitivity : 0.3
	},
	move :
	{
		sensitivity : 10.0,
		amount : new float3(0,0,0)
	},
	motion : new float3(0,0,0),
};


var MasterClass = Class.extend
({
	init: function()
	{

		// Connect frame updates and enable inputmapper
		frame.Updated.connect(this, this.Update);
		
		/*
		//testi
		profiler.BeginBlock("TESTI");
		frame.DelayedExecute(4.0).Triggered.connect(OnDelayedExecution);
		function OnDelayedExecution()
		{
			if (widget5.text)
				widget5.text = "";
			else
				widget5.text="This text is printed every two seconds.";
			frame.DelayedExecute(4.0).Triggered.connect(OnDelayedExecution);
		}
		profiler.EndBlock();
		*/
		
		Log("**** Creating master client objects");

		this.clearScene();
		this.setInfoWidgetLayout();
		this.removeFreeLookCamera();
		this.createMasterClient();
		this.createArrow();
		this.setMasterCamera();
		this.setSpawnPoint();
		this.createInputHandler();
		this.drawCompass();
		this.showInfoWidgetDefaultValues();
		this.helpWidget();
		
		// Connect global messages to corresponding slots
		voidEntity.Action("MSG_MOVE_CAM").Triggered.connect(this, this.MoveCameras); // Move camera forward/backward
		voidEntity.Action("MSG_LETTER_BOX").Triggered.connect(this, this.LetterBox); // Resize black block sizes on screen edges
		ui.GraphicsScene().sceneRectChanged.connect(this, this.windowResized); // Redraw InfoWidget if window size resized
        masterClient.placeable.AttributeChanged.connect(this, this.ParentEntityRefChanged);	// If user changes parent entity reference this function is called
		voidEntity.Action("MSG_STATUSMSG").Triggered.connect(this, this.UpdateStatus); // Sending status messages to widget5
	},
	
	// Clears duplicates from scene if Script is reloaded
	clearScene: function()
	{
		var ui_item = ui.GraphicsScene().items();
		for (var i=0; i < ui_item.length; i++)
		{
			if (ui_item[i].type() == 5 || ui_item[i].type() == 7) // 5=letter box, 7=compass
			{
				ui.GraphicsScene().removeItem(ui_item[i]);
				Log("**** Removed: " +ui_item[i]);
			}
		}
		var oldarrow = scene.GetEntityByName("Arrow");
		if (oldarrow)
		{
			scene.RemoveEntity(oldarrow.id,'');
			Log("**** Old Arrow entity removed");
		}		
	},
	
	
	showInfoWidgetDefaultValues: function()
	{
		widget1.text = "Client1 (MasterClient)";
		widget2.text = "Azimuth: " +azimuth.toFixed(2);
		widget3.text = "Direction of travel: " +direction;		
		widget4.text = "Sector: "+sector;
		widget5.text = "Altitude: "+voidEntity.placeable.transform.pos.y;//.toFixed(2);
	},
	
	createArrow: function()
	{
		arrow3D = scene.CreateLocalEntity(["EC_Placeable", "EC_Mesh", "EC_Name"]);
		arrow3D.SetName("Arrow");
		arrow3D.mesh.meshRef = "assets/Arrow.mesh";
		var mats = arrow3D.mesh.meshMaterial;
		mats[0] = "assets/Metal.material";
		arrow3D.mesh.meshMaterial = mats; 
		arrow3D.placeable.SetParent(voidEntity, preserveWorldTransform=false);
		arrow3DTransform = arrow3D.placeable.transform;
		arrow3DTransform.pos = DEFAULT_A3D_POS;
		arrow3DTransform.rot = DEFAULT_A3D_ROT;
		arrow3DTransform.scale = DEFAULT_A3D_SA;
		arrow3D.placeable.transform = arrow3DTransform; // set transformation
	},
	
	
	ParentEntityRefChanged: function(attribute)
	{
		if (attribute.name === "Parent entity ref")
		{
			voidEntity.Exec(4, "MSG_PARENT_ENTITY_REF_CHG", attribute.value);
			voidEntity.Exec(5, "MSG_STATUSMSG", "Parent entity reference: " + (scene.GetEntityRaw(attribute.value)).name);
			//widget5.text = "Parent entity reference: " + (scene.GetEntityRaw(attribute.value)).name;
		}
	},
	
	setInfoWidgetLayout: function()
	{
		var layout = new QVBoxLayout();
		mainWidget.setLayout(layout);
		mainWidget.setFixedWidth(250);
		layout.addWidget(widget1, 0, 1);
		layout.addWidget(widget2, 0, 1);
		layout.addWidget(widget3, 0, 1);
		layout.addWidget(widget4, 0, 1);
		layout.addWidget(widget5, 0, 1);
		layout.setContentsMargins(10,0,10,5);
		layout.setSpacing(2);
		infoWidgetProxy = ui.AddWidgetToScene(mainWidget);
		mainWidget.setStyleSheet("QLabel {color: black; font-size: 14px;}");
		widget1.setStyleSheet("QLabel {color: blue; font-size: 18px; font-weight: bold;}");
		rect = ui.GraphicsScene().sceneRect;
		infoWidgetProxy.windowFlags = 0;
		infoWidgetProxy.visible = true;
		infoWidgetProxy.y = 10;
		infoWidgetProxy.x = rect.width()-mainWidget.width-10;
		mainWidget.setWindowOpacity(0.3);
	},
	
	helpWidget: function()
	{
		var helpLabel = new QLabel();
		helpLabel.text = 
			"KEYBOARD COMMANDS\n\
			\nW/S/A/D		Move forward/backward/left/right\
			\nSPACE/C	Move up/down\
			\nL/K		Increase/reset black box size\
			\nNumpad +	Change direction of travel to the next sector\
			\nNumpad -	Change direction of travel to the previous sector\
			\nNumpad 8/9	Minor/Major increase vertical FOV\
			\nNumpad 5/6	Minor/Major decrease vertical FOV\
			\nNumpad 7/4	Move cameras forward/backward\
			\nR		Reset to initial state\
			\nH		Show/hide this help\
			\nQ		Show/hide all widgets\
			";
		helperWidgetProxy = new UiProxyWidget(helpLabel);
		helpLabel.setStyleSheet("QLabel {background-color: white; color: black; font-size: 16px; margin: 10px;}");
		helpLabel.setFixedWidth(500);
		helpLabel.setFixedHeight(270);
		helperWidgetProxy.windowFlags = 0;
		helperWidgetProxy.y = 50;
		helperWidgetProxy.x = 310;		
		ui.AddProxyWidgetToScene(helperWidgetProxy);
		helperWidgetProxy.visible = true;
	},
	
	LetterBox: function(size) 
	{
		ui.GraphicsScene().removeItem(block_left);
		ui.GraphicsScene().removeItem(block_right);
		if (size!=0)
		{
			var color = new QColor("black");
			var mainwin = ui.MainWindow();
			var height = mainwin.size.height();
			var width = mainwin.size.width();
			
			var point_left1 = new QPointF(0,0);
			var point_left2 = new QPointF(size,0);
			var point_left3 = new QPointF(size,height);
			var point_left4 = new QPointF(0,height);
			var points_left = new Array(point_left1, point_left2, point_left3, point_left4);
			var qpoly_left = new QPolygon(points_left);
			var poly_left = new QPolygonF(qpoly_left);
			
			var point_right1 = new QPointF(width,0);
			var point_right2 = new QPointF(width-size,0);
			var point_right3 = new QPointF(width-size,height);
			var point_right4 = new QPointF(width,height);
			var points_right = new Array(point_right1, point_right2, point_right3, point_right4);
			var qpoly_right = new QPolygon(points_right);
			var poly_right = new QPolygonF(qpoly_right);
			
			block_left = new QGraphicsPolygonItem(poly_left, 0, scene);	
			block_right = new QGraphicsPolygonItem(poly_right, 0, scene);	
			block_left.setBrush(color);
			block_right.setBrush(color);
			block_left.setOpacity(1.0);
			block_right.setOpacity(1.0);
			ui.GraphicsScene().addItem(block_left);
			ui.GraphicsScene().addItem(block_right);
		}
	},
	
	// move master camera forward or backward
	MoveCameras: function(param)
	{
		masterTransform = masterClient.placeable.transform;
		radians = (sector-1)*60*Math.PI/180;

		if (param == "forward") 
		{
			masterTransform.pos.z -= Math.cos(radians);    
			masterTransform.pos.x += Math.sin(radians);    
			masterClient.placeable.transform = masterTransform;
		}
		else if (param == "backward") 
		{
			masterTransform.pos.z += Math.cos(radians);    
			masterTransform.pos.x -= Math.sin(radians);    
			masterClient.placeable.transform = masterTransform; 
		}
		//widget5.text = "Camera new z position: "+(-masterTransform.pos.z);
		voidEntity.Exec(5, "MSG_STATUSMSG", "Camera new z position: "+(-masterTransform.pos.z));
		masterCamera.SetActive();
	},
	
	
	ChangeForwardDirection: function(sector)
	{
		ui.GraphicsScene().removeItem(arrow);
		var ID = parseInt(sector)+1;
		if (ID == 1) // if MasterClient
		{
			this.drawForwardIndicator();
			widget2.text = "Direction of travel";
		}
		else
			widget2.text = "Direction of travel: client"+ID;
	},
	
	windowResized: function(rect)
	{
		infoWidgetProxy.x = rect.width()-mainWidget.width-10;
	},
	
	WindowResizeListener: function(widg, callbackFunction)
	{
		widg.WindowResized = callbackFunction;
		var graphScene = ui.GraphicsScene().scene();
		graphScene.sceneRectChanged.connect(widg, widg.WindowResized);		
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
		
		_g.motion = voidEntity.placeable.Orientation().Mul(_g.motion);
		voidEntity.placeable.SetPosition(voidEntity.placeable.Position().Add(_g.motion));

		profiler.EndBlock();
	},

	// Create MasterClient-entity which gives placeable data for the clients
	createMasterClient: function()
	{
		masterClient = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);
		masterClient.SetName("MasterCamera");
		masterClient.SetTemporary(true);
		
		// set parenting reference to the Server's Void-entity
		masterClient.placeable.SetParent(voidEntity, preserveWorldTransform=false);
		
		Log("**** MasterClient entity has been created with placeable, camera and name components");
	},

	// Set MasterCamera parameters
	setMasterCamera: function()
	{
		masterCamera = masterClient.camera;
		masterCamera.verticalFov = DEFAULT_FOV;
		masterCamera.SetActive();
	},
	
	// Set initial spawn point
	setSpawnPoint: function()
	{
		voidEntity.placeable.SetPosition(DEFAULT_POS);
		voidTransform = voidEntity.placeable.transform;
		voidTransform.rot = DEFAULT_ROT;
		voidEntity.placeable.transform = voidTransform;
	},
	
	// Create handler for keyboard and mouse events
	createInputHandler: function()
	{
		var inputContext = input.RegisterInputContextRaw("FreeLookCamera", 101);
		inputContext.takeMouseEventsOverQt = true;
		inputContext.KeyPressed.connect(this, this.HandleKeyPress);
		inputContext.KeyReleased.connect(this, this.HandleKeyRelease);
		inputContext.MouseEventReceived.connect(this, this.HandleMouse);
		Log("**** InputHandler initialized...");
	},
	
	// Handler for key press commands 
	HandleKeyPress: function(e)
	{
		radians = (direction)*Math.PI/180;
		
		//widget5.text = "ZX-coordinates: "
		voidEntity.Exec(5, "MSG_STATUSMSG", "ZX-coordinates: "
			+ voidEntity.placeable.WorldPosition().z.toFixed(2)
			+ ", " +voidEntity.placeable.WorldPosition().x.toFixed(2));

		// move forward
		if (e.keyCode == Qt.Key_W)
		{
			_g.move.amount.z = -Math.cos(radians);
			_g.move.amount.x = Math.sin(radians);

		}
		
		// move backward
		else if (e.keyCode == Qt.Key_S)
		{
			_g.move.amount.z = Math.cos(radians);
			_g.move.amount.x = -Math.sin(radians);
		}
		
		// move right
		else if (e.keyCode == Qt.Key_D)
		{
			_g.move.amount.z = Math.sin(radians);
			_g.move.amount.x = Math.cos(radians);
		}
		
		// move left
		else if (e.keyCode == Qt.Key_A)
		{
			_g.move.amount.z = -Math.sin(radians);
			_g.move.amount.x = -Math.cos(radians);
		}
		
		// move up
		else if (e.keyCode == Qt.Key_Space)
		{
			_g.move.amount.y = 1;
			//widget5.text = "Altitude: "+voidEntity.placeable.transform.pos.y.toFixed(2);
			voidEntity.Exec(5, "MSG_STATUSMSG", "Altitude: "+voidEntity.placeable.transform.pos.y.toFixed(2));
		}
		
		// move down
		else if (e.keyCode == Qt.Key_C)
		{
			_g.move.amount.y = -1;
			//widget5.text = "Altitude: "+voidEntity.placeable.transform.pos.y.toFixed(2);
			voidEntity.Exec(5, "MSG_STATUSMSG", "Altitude: "+voidEntity.placeable.transform.pos.y.toFixed(2));
		}
		
		// change next sector
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_Plus)
		{
			if (direction == Math.ceil(direction/60)*60)
				direction += 60;
			else
				direction = Math.ceil(direction/60)*60;
			if (direction > 300)
				direction = 0;
			arrow3DTransform.rot.y = -90-direction;
			arrow3D.placeable.transform = arrow3DTransform;
			sector = direction/60+1;	
			voidEntity.Exec(5, "MSG_ROTATE_ARROW", direction);
			widget3.text = "Direction of travel: " +direction;		
			widget4.text = "Sector: "+sector;
		}
		
		// change previous sector
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_Minus)
		{
			if (direction == Math.floor(direction/60)*60)
				direction -= 60;
			else
				direction = Math.floor(direction/60)*60;
			if (direction < 0)
				direction = 300;
			arrow3DTransform.rot.y = -90-direction;
			arrow3D.placeable.transform = arrow3DTransform;
			sector = direction/60+1;	
			voidEntity.Exec(5, "MSG_ROTATE_ARROW", direction);
			widget3.text = "Direction of travel: " +direction;		
			widget4.text = "Sector: "+sector;
		}
		
		// major increase vertical fov
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_9)
		{
			fov += 1.0;
			masterCamera.verticalFov = fov;
			//widget5.text = "Field of vision: "+fov.toFixed(2);
			voidEntity.Exec(5, "MSG_STATUSMSG", "Field of vision: "+fov.toFixed(2));
			voidEntity.Exec(4, "MSG_FOV_CHG", fov);	// 4=peers
		}
		
		// minor increase vertical fov
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_8)
		{
			fov += 0.05;
			masterCamera.verticalFov = fov;
			//widget5.text = "Field of vision: "+fov.toFixed(2);
			voidEntity.Exec(5, "MSG_STATUSMSG", "Field of vision: "+fov.toFixed(2));
			voidEntity.Exec(4, "MSG_FOV_CHG", fov);
		}		
		
		// major decrease vertical fov
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_6)
		{
			fov -= 1.0;
			masterCamera.verticalFov = fov;
			//widget5.text = "Field of vision: "+fov.toFixed(2);
			voidEntity.Exec(5, "MSG_STATUSMSG", "Field of vision: "+fov.toFixed(2));
			voidEntity.Exec(4, "MSG_FOV_CHG", fov);
		}
		
		// minor decrease vertical fov
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_5)
		{
			fov -= 0.05;
			masterCamera.verticalFov = fov;
			//widget5.text = "Field of vision: "+fov.toFixed(2);
			voidEntity.Exec(5, "MSG_STATUSMSG", "Field of vision: "+fov.toFixed(2));
			voidEntity.Exec(4, "MSG_FOV_CHG", fov);
		}			

		// Reset initial state
		else if (e.keyCode == Qt.Key_R)
		{
			this.showInfoWidgetDefaultValues();
			this.setSpawnPoint();
			fov = DEFAULT_FOV;
			direction = DEFAULT_DIR;
			azimuth = DEFAULT_AZM;
			masterCamera.verticalFov = DEFAULT_FOV;
			compass.setRotation((voidTransform.rot.y)%360)
			arrow3DTransform = arrow3D.placeable.transform;
			arrow3DTransform.rot = DEFAULT_A3D_ROT;
			arrow3DTransform.pos = DEFAULT_A3D_POS;
			arrow3D.placeable.transform = arrow3DTransform;
			
			masterClient.placeable.SetPosition(new float3(0,0,0));
			//widget5.text = "CAMERAS SET TO INITIAL STATE";
			voidEntity.Exec(5, "MSG_STATUSMSG", "CAMERAS SET TO INITIAL STATE");
			voidEntity.Exec(4, "MSG_RESET_CAMERAS");
		}
		
		// Move cameras forward
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_7)
			voidEntity.Exec(5, "MSG_MOVE_CAM", "forward");
		
		// Move cameras backward
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_4)
			voidEntity.Exec(5, "MSG_MOVE_CAM", "backward");
		
		// Increase black block size
		else if (e.keyCode == Qt.Key_L)
		{
			block_size += 5;
			voidEntity.Exec(5, "MSG_LETTER_BOX", block_size);
		}

		// Reset black block size
		else if (e.keyCode == Qt.Key_K)
		{
			block_size = 0;
			voidEntity.Exec(5, "MSG_LETTER_BOX", block_size);
		}
		
		// Show/hide all widgets and extra graphics
		else if (e.keyCode == Qt.Key_Q)
		{
			if (infoWidgetProxy.visible == true)
			{
				infoWidgetProxy.visible = false;
				helperWidgetProxy.visible = false;
				compass.hide();
				needle.hide();
				arrow3D.mesh.RemoveMesh();
				voidEntity.Exec(4, "MSG_TOGGLE_WIDGETS", "HIDE");
			}
			else
			{
				infoWidgetProxy.visible = true;
				compass.show();
				needle.show();
				arrow3D.mesh.meshRef = "assets/Arrow.mesh";
				voidEntity.Exec(4, "MSG_TOGGLE_WIDGETS", "SHOW");
			}
		}
		
		// Show/hide help widget
		else if (e.keyCode == Qt.Key_H)
		{
			if (helperWidgetProxy.visible == true)
				helperWidgetProxy.visible = false;
			else
				helperWidgetProxy.visible = true;
		}
	},
	
	// Handler for key release commands (stop movement)
	HandleKeyRelease: function(e)
	{
	if (e.keyCode == Qt.Key_W && _g.move.amount.z != 0 )
		_g.move.amount = new float3(0,0,0);
	
	else if (e.keyCode == Qt.Key_S && _g.move.amount.z != 0)
		_g.move.amount = new float3(0,0,0);
	
	else if (e.keyCode == Qt.Key_D && _g.move.amount.x != 0)
		_g.move.amount = new float3(0,0,0);
		
	else if (e.keyCode == Qt.Key_A && _g.move.amount.x != 0)
		_g.move.amount = new float3(0,0,0);
	
	else if (e.keyCode == Qt.Key_Space && _g.move.amount.y != 0)
		_g.move.amount = new float3(0,0,0);
		
	else if (e.keyCode == Qt.Key_C && _g.move.amount.y != 0)
		_g.move.amount = new float3(0,0,0);
	},

	// Handler for mouse events
	HandleMouse: function(e)
	{
		if (e.IsButtonDown(2) && !input.IsMouseCursorVisible())
		{
			mouselook = true;
			if (e.relativeX != 0)
				this.HandleMouseLookX(e.relativeX);
			if (e.relativeY != 0)
				this.HandleMouseLookY(e.relativeY);
		}
		else if (e.IsButtonDown(1))
			this.HandleMousePan(e.relativeX)
		
		else if (e.GetEventType() == 4)
			mouselook = false;
	},

	// Handler for mouse x axis relative movement
	HandleMouseLookX: function(param)
	{
		voidTransform = voidEntity.placeable.transform;
		voidTransform.rot.y -= _g.rotate.sensitivity * parseInt(param);
		voidEntity.placeable.transform = voidTransform; // sets new rotation
		compass.setRotation((voidTransform.rot.y)%360);
		widget2.text = "Azimuth: " +(-(voidTransform.rot.y)%360).toFixed(2);
	},

	// Handler for mouse y axis relative movement
	HandleMouseLookY: function(param)
	{
		voidTransform = voidEntity.placeable.transform;
		radians = (sector-1)*60*Math.PI/180;
		voidTransform.rot.x -= _g.rotate.sensitivity * parseInt(param);
		if (voidTransform.rot.x > 90.0)
			voidTransform.rot.x = 90.0;
		if (voidTransform.rot.x < -90.0)
			voidTransform.rot.x = -90.0;
		voidEntity.placeable.transform = voidTransform;	
	},
	
	HandleMousePan: function(param)
	{
		var increase = param/rect.width()*120;
		if (param < 0 && direction+increase < 10 && direction+increase > 0)	// snap to zero
			direction = 0;
		else if (param > 0 && direction+increase > 350)						// snap to zero
			direction = 0;
		else if (direction+increase < 0)
			direction = 360+increase;
		else if (direction+increase > 360)
			direction = increase;
		else
			direction = direction+increase;
		widget3.text = "Direction of travel: " +direction.toFixed(2);

		arrow3DTransform = arrow3D.placeable.transform;
		arrow3DTransform.rot.y = -90-direction;
		arrow3D.placeable.transform = arrow3DTransform;
		voidEntity.Exec(5, "MSG_ROTATE_ARROW", direction);
	},
	
	drawCompass: function()
	{
		var pmCompass = new QPixmap(asset.GetAsset("compass.png").DiskSource());
		var pmNeedle = new QPixmap(asset.GetAsset("needle.png").DiskSource());
		compass = ui.GraphicsScene().addPixmap(pmCompass);
		needle = ui.GraphicsScene().addPixmap(pmNeedle);
		compass.setTransformOriginPoint(pmCompass.width()/2, pmCompass.height()/2);
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
	},
	
	UpdateStatus: function(text)
	{
		widget5.text = text;
	}	
});

// Startup
_masterClientInstance = new MasterClass();

// EOF