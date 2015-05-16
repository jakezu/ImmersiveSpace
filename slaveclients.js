var _slaveClientInstance = null;
var voidEntity = scene.GetEntityByName("Void");
var slaveClient; // SlaveClient entity
var slaveCamera; // Camera component of SlaveClient entity
var slaveTransform; // Variable for transform function of Slave Client's placeable component
var DEFAULT_SECT = 1; // Global value for sector of direction of travel
var DEFAULT_FOV = 38.5; // Global value for Field of vision (45 = default, 38.5 is good in one particular setup)
var sector = DEFAULT_SECT; // Set initial value for sector of direction of travel
var fov = DEFAULT_FOV; // Set initial value of fov
var mainWidget = new QWidget(); // Info layout widget for showing additional information
var widget1 = new QLabel(); // Info widget #1
var widget2 = new QLabel(); // Info widget #2
var widget3 = new QLabel(); // Info widget #3
var widget4 = new QLabel(); // Info widget #4
var widget5 = new QLabel(); // Info widget #5
var infoWidgetProxy; // Info widget proxy layer
var block_size = 0; // Letter box initial size
var block_left = new QGraphicsPolygonItem(); // Left letter box
var block_right = new QGraphicsPolygonItem(); // Right letter box

// Get client's ID number
var regexp = /\d/; // match number
var client_ID = regexp.exec(client.LoginProperty("username"));

// Get angle for 3D Arrow position calculations in radians. Angle is different at each client
var a3DAng = (client_ID - 1)*60*Math.PI/180;

var arrow3D; // 3D arrow entity
var arrow3DTransform; // Variable for transform function of 3D Arrow's placeable component
var DEFAULT_A3D_POS = new float3(3*Math.sin(a3DAng), -0.9, -3*Math.cos(a3DAng));
var DEFAULT_A3D_ROT = new float3(0,-90,0); // Initial value of 3D Arrow's rotation
var DEFAULT_A3D_SA = new float3(0.1,0.01,0.1); // Initial value of 3D Arrow's scale
var camAng; // Variable for trigonometric calculations of camera in radians

//del after tests
var FPSlabel = new QLabel();
var FPSWidgetProxy;

/**
The SlaveClass class.
@class SlaveClass
@extension LoaderClass
@constructor
*/

var SlaveClass = Class.extend
({
	/**
	 * Slave class initialisation.
	 * @method init
	 * @return 
	 */
	init: function()
	{

		//frame.Updated.connect(function(){widget5.text=frame.WallClockTime()}); //added 13.5
		
		Log("**** Creating slave client objects");

		this.clearScene();
		this.setWidgetLayout();
		//this.FPS();
		this.createSlaveClient();
		this.setSlaveCamera();
		this.createArrow();
		this.removeFreeLookCamera();
		
		// Connect global messages to corresponding slots
		ui.GraphicsScene().sceneRectChanged.connect(this, this.windowResized);
		voidEntity.Action("MSG_FOV_CHG").Triggered.connect(this, this.ChangeFov);
		voidEntity.Action("MSG_PARENT_ENTITY_REF_CHG").Triggered.connect(this, this.setParentEntityRef);
		voidEntity.Action("MSG_MOVE_CAM").Triggered.connect(this, this.MoveCameras);
		voidEntity.Action("MSG_RESET_CAMERAS").Triggered.connect(this, this.ResetCameras);
		voidEntity.Action("MSG_LETTER_BOX").Triggered.connect(this, this.LetterBox);
		voidEntity.Action("MSG_ROTATE_ARROW").Triggered.connect(this, this.RotateArrow);
		voidEntity.Action("MSG_TOGGLE_WIDGETS").Triggered.connect(this, this.ToggleWidgets);
		voidEntity.Action("MSG_STATUSMSG").Triggered.connect(this, this.UpdateStatus);
		voidEntity.Action("MSG_STATUSMSG2").Triggered.connect(this, this.UpdateStatus2);
	},
	
	// Clear scene if there is already 3D Arrow entity.
	// This occurs if Script is reloaded without quitting it first
	/**
	 * Description
	 * @method clearScene
	 * @return 
	 */
	clearScene: function()
	{
		var oldarrow = scene.GetEntityByName("Arrow");
		if (oldarrow)
		{
			scene.RemoveEntity(oldarrow.id,'');
			Log("**** Old Arrow entity removed");
		}		
	},
	
	/**
	 * Description
	 * @method setWidgetLayout
	 * @return 
	 */
	setWidgetLayout: function()
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
	
	FPS: function()
	{
		FPSlabel.setFixedWidth(1000);
		FPSlabel.setFixedHeight(400);		
		FPSlabel.setStyleSheet("QLabel {background-color: rgba(0,0,0,0%); color: red; font-size: 180px;}");
		FPSWidgetProxy = new UiProxyWidget(FPSlabel);
		FPSWidgetProxy.y = 300;
		FPSWidgetProxy.x = (rect.width())/2-(FPSlabel.width)/2;
		FPSWidgetProxy.windowFlags = 0;
		ui.AddProxyWidgetToScene(FPSWidgetProxy);
		FPSWidgetProxy.visible = true;
	},	
	
	/**
	 * Description
	 * @method ToggleWidgets
	 * @param {} param
	 * @return 
	 */
	ToggleWidgets: function(param)
	{
		if (param == "HIDE")
		{
			infoWidgetProxy.visible = false;
			arrow3D.mesh.RemoveMesh();
		}
		else if (param == "SHOW")
		{
			infoWidgetProxy.visible = true;
			arrow3D.mesh.meshRef = "assets/Arrow.mesh";
		}
	},
	
	/**
	 * Description
	 * @method RotateArrow
	 * @param {} param
	 * @return 
	 */
	RotateArrow: function(param)
	{
		arrow3DTransform = arrow3D.placeable.transform;
		arrow3DTransform.rot.y = -90-param;
		arrow3D.placeable.transform = arrow3DTransform;
	},
	
	/**
	 * Description
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
	
	/**
	 * Description
	 * @method MoveCameras
	 * @param {} param
	 * @return 
	 */
	MoveCameras: function(param)
	{
		slaveTransform = slaveClient.placeable.transform;
		camAng = sector*60*Math.PI/180;
		if (param == "forward") 
		{
			slaveTransform.pos.z -= Math.cos(camAng);    
			slaveTransform.pos.x += Math.sin(camAng);    
			slaveClient.placeable.transform = slaveTransform;
		}
		else if (param == "backward") 
		{
			slaveTransform.pos.z += Math.cos(camAng);    
			slaveTransform.pos.x -= Math.sin(camAng);    
			slaveClient.placeable.transform = slaveTransform; 
		}
		//widget5.text = "Camera new z position: "+(-slaveTransform.pos.z);
		slaveCamera.SetActive();
	},
	
	/**
	 * Description
	 * @method ResetCameras
	 * @return 
	 */
	ResetCameras: function()
	{
		fov = DEFAULT_FOV;
		slaveCamera.verticalFov = DEFAULT_FOV;
		arrow3DTransform = arrow3D.placeable.transform;
		arrow3DTransform.rot = DEFAULT_A3D_ROT;
		arrow3DTransform.pos = DEFAULT_A3D_POS;
		arrow3D.placeable.transform = arrow3DTransform;
		slaveClient.placeable.SetPosition(new float3(0,0,0));
		//widget5.text = "CAMERAS SET TO INITIAL STATE";		
	},		
	
	/**
	 * Description
	 * @method setParentEntityRef
	 * @param {} attribute
	 * @return 
	 */
	setParentEntityRef: function(attribute)
	{
		var entity = scene.GetEntityRaw(attribute);
		//widget5.text = "Parent entity reference: " + entity.name;
		slaveClient.placeable.SetParent(entity, preserveWorldTransform=false);
	},

	/**
	 * Description
	 * @method ChangeFov
	 * @param {} fov
	 * @return 
	 */
	ChangeFov: function(fov)
	{
		slaveCamera.verticalFov = fov;
		//widget5.text = "Field of vision: "+fov;
	},
	
	/**
	 * Description
	 * @method WindowResizeListener
	 * @param {} widg
	 * @param {} callbackFunction
	 * @return 
	 */
	WindowResizeListener: function(widg, callbackFunction)
	{
		widg.WindowResized = callbackFunction;
		var graphScene = ui.GraphicsScene().scene();
		graphScene.sceneRectChanged.connect(widg, widg.WindowResized);		
	},	
	
	/**
	 * Description
	 * @method windowResized
	 * @param {} rect
	 * @return 
	 */
	windowResized: function(rect)
	{
		infoWidgetProxy.x = rect.width()-mainWidget.width-10;
	},	
	

	// Create SlaveClient-entity which gets placeable data from the server
	/**
	 * Description
	 * @method createSlaveClient
	 * @return 
	 */
	createSlaveClient: function()
	{
		slaveClient = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);
		slaveClient.SetName("SlaveCamera");
		slaveClient.SetTemporary(true);
		
		// set parenting reference to the Server's Void-entity
		slaveClient.placeable.SetParent(voidEntity, preserveWorldTransform=false);
		
		Log("**** SlaveClient entity has been created with placeable, camera and name components");
	},
	
	// Set SlaveCamera parameters
	/**
	 * Description
	 * @method setSlaveCamera
	 * @return 
	 */
	setSlaveCamera: function()
	{
		slaveCamera = slaveClient.camera;
		slaveTransform = slaveClient.placeable.transform;
		slaveCamera.verticalFov = fov;
		
		widget1.text = "Client" + client_ID + " (SlaveClient)";
		
		// Rotate camera by ID * 60 degrees (when rotated to clockwise, negative y-axis value is needed)
		slaveTransform.rot.y = -(client_ID-1) * 60;
		slaveClient.placeable.transform = slaveTransform;
		slaveCamera.SetActive();
		
		Log("**** SlaveCamera has been set and rotated by " + (client_ID-1)*60 + " degrees clockwise");
		
	},
	
	
	/**
	 * Description
	 * @method createArrow
	 * @return 
	 */
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
	 * Description
	 * @method UpdateStatus
	 * @param {} text
	 * @return 
	 */
	UpdateStatus: function(text)
	{
		widget5.text = text;
	},
	
	UpdateStatus2: function(text)
	{
		//Log(text);
		FPSlabel.text = Math.round(text*100000)/100000;
		//widget5.text = text;
	}
	
});

// Startup
_slaveClientInstance = new SlaveClass();

// EOF
