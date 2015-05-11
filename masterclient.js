/* masterclient.js /*

/* Globals and their initial values */
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
 
/**
 * Movement modifier.
 * @method _g
 */
 
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

/**
The MasterClass class.
@class MasterClass
@extension LoaderClass
@constructor
*/

var MasterClass = Class.extend
({
	/**
	 * Master class initialisation.
	 * @method init
	 * @static 
	 */
	 
	init: function()
	{

		/**
		 * Connect frame updates.
		 * @event frame.Updated.connect
		 * @param Update {Object} Function to invoke
		 */
		 
		//frame.Updated.connect(this, this.Update);
		frame.Updated.connect(this.Update);
	
		Log("**** Creating master client objects");

		this.clearScene();
		this.setInfoWidgetLayout();
		this.removeFreeLookCamera();
		this.createMasterClient();
		this.create3DArrow();
		this.setMasterCamera();
		this.setSpawnPoint();
		this.createInputHandler();
		this.drawCompass();
		this.showInfoWidgetDefaultValues();
		this.helpWidget();
		
		/**
		 * Connect camera movement handler.
		 * @event voidEntity.Action("MSG_MOVE_CAM").Triggered.connect
		 * @param MoveCameras {Object} Function to invoke
		 */
		voidEntity.Action("MSG_MOVE_CAM").Triggered.connect(this.MoveCameras);

		/**
		 * Connect screen letterbox size handler.
		 * @event voidEntity.Action("MSG_LETTER_BOX").Triggered.connect
		 * @param LetterBox {Object} Function to invoke
		 */
		voidEntity.Action("MSG_LETTER_BOX").Triggered.connect(this.LetterBox);

		/**
		 * Connect status message handler.
		 * @event voidEntity.Action("MSG_STATUSMSG").Triggered.connect
		 * @param UpdateStatus {Object} Function to invoke
		 */
		voidEntity.Action("MSG_STATUSMSG").Triggered.connect(this.UpdateStatus); // 
		
		/**
		 * Connect window resize listener.
		 * @event ui.GraphicsScene().sceneRectChanged.connect
		 * @param windowResized {Object} Function to invoke
		 */		
		ui.GraphicsScene().sceneRectChanged.connect(this.windowResized);
		
		/**
		 * Connect attribute change listener.
		 * @event  masterClient.placeable.AttributeChanged.connect
		 * @param ParentEntityRefChanged {Object} Function to invoke
		 */		
        masterClient.placeable.AttributeChanged.connect(this.ParentEntityRefChanged);	// If user changes parent entity reference this function is called
	},
	
	/**
	 * Clears duplicates from scene if Script is reloaded
	 * @method clearScene
	 */
	clearScene: function()
	{
		/**
		 * Get array of scene items.
		 * @method ui.GraphicsScene().items
		 * @return {Array} ui_items.
		 */
		 
		var ui_items = ui.GraphicsScene().items();
		for (var i=0; i < ui_items.length; i++)
		{
			if (ui_items[i].type() == 5 || ui_items[i].type() == 7) // 5=letter box, 7=compass
			{
				/**
				 * Remove item.
				 * @method ui.GraphicsScene().removeItem
				 * @param param {Object} Item to remove
				 */			
				ui.GraphicsScene().removeItem(ui_items[i]);
				
				Log("**** Removed: " +ui_items[i]);
			}
		}
		
		/**
		 * Get entity by name.
		 * @method scene.GetEntityByName
		 * @param name {String} Entity name to get
		 * @return {Object} Arrow.
		 */	
		
		var oldArrow = scene.GetEntityByName("Arrow");
		if (oldArrow)
		{
			/**
			 * Remove (old) Arrow entity if found
			 * @method scene.RemoveEntity
			 * @param oldArrow.Id {Number} Arrow's id number
			 * @param AttributeChange=Default {Enum} Enumeration of attribute/component change types for replication. (2=LocalOnly, 3=Replicate)
			 * @return {Boolean} Return true if entity has been found and removed.
			*/		
			scene.RemoveEntity(oldArrow.Id(),'');
			
			Log("**** Old Arrow entity removed");
		}		
	},
	
	
	/**
	 * Sets and shows Info widget default values.
	 * @method showInfoWidgetDefaultValues
	 */
	showInfoWidgetDefaultValues: function()
	{
		widget1.text = "Client1 (MasterClient)";
		widget2.text = "Azimuth: " +azimuth.toFixed(2);
		widget3.text = "Direction of travel: " +direction;		
		widget4.text = "Sector: "+sector;
		widget5.text = "Altitude: "+voidEntity.placeable.transform.pos.y;//.toFixed(2);
	},
	
	/**
	 * Create 3D Arrow entity.
	 * @method create3DArrow
	 */
	create3DArrow: function()
	{
		/**
		 * Create 3D Arrow local entity with Placeable, Mesh and Name components.
		 * @method scene.CreateLocalEntity
		 * @param components {Array} Creates entity with listed components
		 */
		arrow3D = scene.CreateLocalEntity(["EC_Placeable", "EC_Mesh", "EC_Name"]);

		/**
		 * Set 3D arrow entity's name.
		 * @method arrow3D.SetName
		 * @param param {String}
		 */		
		arrow3D.SetName("Arrow");
		
		/**
		 * Set 3D arrow mesh reference.
		 * @method arrow3D.mesh.meshRef
		 * @param param {String} Mesh file name and path
		 */			
		arrow3D.mesh.meshRef = "assets/Arrow.mesh";

		/**
		 * Set 3D arrow mesh material.
		 * @method arrow3D.mesh.meshMaterial
		 * @param param {String} Mesh material file name and path
		 */			
		var mats = arrow3D.mesh.meshMaterial;
		mats[0] = "assets/Metal.material";
		arrow3D.mesh.meshMaterial = mats;

		/**
		 * Parents 3D arrow entity to Void-entity.
		 * @method arrow3D.placeable.SetParent
		 * @param entity {Object} Parenting refers to this entity (Void-entity)
		 * @param preserveWorldTransform=false {Boolean} When false, the transform attribute of this placeable is treated as the new local
		 */			
		arrow3D.placeable.SetParent(voidEntity, preserveWorldTransform=false);
		
		/**
		 * Set 3D arrow transformation to initial position, rotation and scale.
		 * @method arrow3D.placeable.transform
		 */			
		arrow3DTransform = arrow3D.placeable.transform;
		arrow3DTransform.pos = DEFAULT_A3D_POS;
		arrow3DTransform.rot = DEFAULT_A3D_ROT;
		arrow3DTransform.scale = DEFAULT_A3D_SA;
		arrow3D.placeable.transform = arrow3DTransform; // sets transformation
	},
	
	
	/**
	 * Send new parent entity reference value to all slave clients if user changes that.
	 * @method ParentEntityRefChanged
	 * @param {} attribute
	 * @return 
	 */
	ParentEntityRefChanged: function(attribute)
	{
		if (attribute.name === "Parent entity ref")
		{
			voidEntity.Exec(4, "MSG_PARENT_ENTITY_REF_CHG", attribute.value);
			voidEntity.Exec(5, "MSG_STATUSMSG", "Parent entity reference: " + (scene.GetEntityRaw(attribute.value)).name);
			//widget5.text = "Parent entity reference: " + (scene.GetEntityRaw(attribute.value)).name;
		}
	},
	
	/**
	 * Description
	 * @method setInfoWidgetLayout
	 * @return 
	 */
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
	
	/**
	 * Description
	 * @method helpWidget
	 * @return 
	 */
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
	
	/**
	 * Resize black block sizes on screen edges
	 * @method LetterBox
	 * @param {} size
	 * @return 
	 */
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
	/**
	 * Description
	 * @method MoveCameras
	 * @param {} param
	 * @return 
	 */
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
	
	
	/**
	 * Description
	 * @method ChangeForwardDirection
	 * @param {} sector
	 * @return 
	 */
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
	
	/**
	 * Redraw InfoWidget if window size resized.
	 * @method windowResized
	 * @param {} rect
	 * @return 
	 */
	 
	windowResized: function(rect)
	{
		infoWidgetProxy.x = rect.width()-mainWidget.width-10;
	},

	
	/**
	 * Description
	 * @method Update
	 * @param {} frametime
	 * @return 
	 */
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
		
		/**
		 * Returns the orientation of Void-entity placeable's transform.
		 * @method voidEntity.placeable.Orientation
		 * @param _g.motion {Array} _g.motion vector multiplied by quaternion of itself
		 */
		
		_g.motion = voidEntity.placeable.Orientation().Mul(_g.motion);
		
		/**
		 * Sets the position of Void-entity placeable's transform.
		 * @method voidEntity.placeable.SetPosition
		 * @param _g.motion {Array} Current position added by g_motion
		 */
		 
		voidEntity.placeable.SetPosition(voidEntity.placeable.Position().Add(_g.motion));

		profiler.EndBlock();
	},

	// Create MasterClient-entity which gives placeable data for the clients
	/**
	 * Description
	 * @method createMasterClient
	 * @return 
	 */
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
	/**
	 * Description
	 * @method setMasterCamera
	 * @return 
	 */
	setMasterCamera: function()
	{
		masterCamera = masterClient.camera;
		masterCamera.verticalFov = DEFAULT_FOV;
		masterCamera.SetActive();
	},
	
	// Set initial spawn point
	/**
	 * Description
	 * @method setSpawnPoint
	 * @return 
	 */
	setSpawnPoint: function()
	{
		voidEntity.placeable.SetPosition(DEFAULT_POS);
		voidTransform = voidEntity.placeable.transform;
		voidTransform.rot = DEFAULT_ROT;
		voidEntity.placeable.transform = voidTransform;
	},
	
	// Create handler for keyboard and mouse events
	/**
	 * Description
	 * @method createInputHandler
	 * @return 
	 */
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
	/**
	 * Description
	 * @method HandleKeyPress
	 * @param {} e
	 * @return 
	 */
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
			this.setSpawnPoint();
			fov = DEFAULT_FOV;
			direction = DEFAULT_DIR;
			azimuth = DEFAULT_AZM;
			sector = DEFAULT_SECT;
			masterCamera.verticalFov = DEFAULT_FOV;
			compass.setRotation((voidTransform.rot.y)%360)
			arrow3DTransform = arrow3D.placeable.transform;
			arrow3DTransform.rot = DEFAULT_A3D_ROT;
			arrow3DTransform.pos = DEFAULT_A3D_POS;
			arrow3D.placeable.transform = arrow3DTransform;
			
			masterClient.placeable.SetPosition(new float3(0,0,0));
			//widget5.text = "CAMERAS SET TO INITIAL STATE";
			this.showInfoWidgetDefaultValues();
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
	/**
	 * Description
	 * @method HandleKeyRelease
	 * @param {} e
	 * @return 
	 */
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
	/**
	 * Description
	 * @method HandleMouse
	 * @param {} e
	 * @return 
	 */
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
	/**
	 * Description
	 * @method HandleMouseLookX
	 * @param {} param
	 * @return 
	 */
	HandleMouseLookX: function(param)
	{
		voidTransform = voidEntity.placeable.transform;
		voidTransform.rot.y -= _g.rotate.sensitivity * parseInt(param);
		voidEntity.placeable.transform = voidTransform; // sets new rotation
		azimuth = -(voidTransform.rot.y)%360;
		if (azimuth < 0)
			azimuth = 360 + azimuth;
		compass.setRotation(-azimuth);
		//compass.setRotation((voidTransform.rot.y)%360);
		widget2.text = "Azimuth: " + azimuth.toFixed(2);
		//widget2.text = "Azimuth: " +(-(voidTransform.rot.y)%360).toFixed(2);
	},

	// Handler for mouse y axis relative movement
	/**
	 * Description
	 * @method HandleMouseLookY
	 * @param {} param
	 * @return 
	 */
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
	
	/**
	 * Description
	 * @method HandleMousePan
	 * @param {} param
	 * @return 
	 */
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
		widget4.text = "Sector: " + parseInt((direction/60)+1);

		arrow3DTransform = arrow3D.placeable.transform;
		arrow3DTransform.rot.y = -90-direction;
		arrow3D.placeable.transform = arrow3DTransform;
		voidEntity.Exec(5, "MSG_ROTATE_ARROW", direction);
	},
	
	/**
	 * Description
	 * @method drawCompass
	 * @return 
	 */
	drawCompass: function()
	{
		var pmCompass = new QPixmap(asset.GetAsset("compass.png").DiskSource());
		var pmNeedle = new QPixmap(asset.GetAsset("needle.png").DiskSource());
		compass = ui.GraphicsScene().addPixmap(pmCompass);
		needle = ui.GraphicsScene().addPixmap(pmNeedle);
		compass.setTransformOriginPoint(pmCompass.width()/2, pmCompass.height()/2);
	},
	
	// Remove FreeLookCamera from the scene
	/**
	 * Description
	 * @method removeFreeLookCamera
	 * @return 
	 */
	removeFreeLookCamera: function()
	{
		var freelookcamera = scene.GetEntityByName("FreeLookCamera");
		
		if (freelookcamera)
		{
			scene.RemoveEntity(freelookcamera.id,'');
			Log("**** FreeLookCamera entity removed");
		}
	},
	
	/**
	 * Shows status messages in widget5
	 * @method UpdateStatus
	 * @param {} text
	 * @return 
	 */
	UpdateStatus: function(text)
	{
		widget5.text = text;
	}	
});

// Startup
_masterClientInstance = new MasterClass();

// EOF