engine.IncludeFile("local://class.js"); // from jsmodules/lib

var _p = null;
var voidentity = scene.GetEntityByName("Void");
var slaveclient;
var slavecamera;
var sector = 1;
var fov = 38.5; // Field of vision (45 = default, 38.5 is good in one particular setup)
var pixmap_arrow = new QPixmap();
var arrow = new QPixmap();
var client_ID;
var proxy = new UiProxyWidget();
var mainWidget = new QWidget();
var widget1 = new QLabel();
var widget2 = new QLabel();
var widget3 = new QLabel();
var widget4 = new QLabel();
var widget5 = new QLabel();
var block_size = 0;
var block_a = new QGraphicsPolygonItem();
var block_b = new QGraphicsPolygonItem();
var arrow3;

var SlaveClient = Class.extend
({
	init: function()
	{

		Log("**** Creating slave client objects");

		this.setWidgetLayout();
		this.createSlaveClient();
		this.createArrow();
		this.setSlaveCamera();
		this.removeFreeLookCamera();
		
		// Signals
		ui.GraphicsScene().sceneRectChanged.connect(this, this.windowResized);
		voidentity.Action("ChangeForwardDirectionMsg").Triggered.connect(this, this.ChangeForwardDirection);
		voidentity.Action("ChangeFovMsg").Triggered.connect(this, this.ChangeFov);
		voidentity.Action("ChangeParentEntityRefMsg").Triggered.connect(this, this.setParentEntityRef);
		voidentity.Action("MoveCamerasMsg").Triggered.connect(this, this.MoveCameras);
		voidentity.Action("ResetCamerasMsg").Triggered.connect(this, this.ResetCameras);
		voidentity.Action("LetterBoxMsg").Triggered.connect(this, this.LetterBox);
	},
	
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
		proxy = ui.AddWidgetToScene(mainWidget);
		//mainWidget.setStyleSheet("QLabel {background-color: transparent; color: black; font-size: 16px; opacity: 0,2;}");
		mainWidget.setStyleSheet("QLabel {color: black; font-size: 14px;}");
		widget1.setStyleSheet("QLabel {color: blue; font-size: 18px; font-weight: bold;}");
		rect = ui.GraphicsScene().sceneRect;
		//proxy.windowFlags = Qt.Widget;
		proxy.windowFlags = 0;
		proxy.visible = true;
		proxy.y = 10;
		proxy.x = rect.width()-mainWidget.width-10;
		mainWidget.setWindowOpacity(0.3);
	},
	
	LetterBox: function(size) 
	{
		ui.GraphicsScene().removeItem(block_a);
		ui.GraphicsScene().removeItem(block_b);
		if (size!=0)
		{
			var color = new QColor("black");
			var mainwin = ui.MainWindow();
			var height = mainwin.size.height();
			var width = mainwin.size.width();
			
			var point_a1 = new QPointF(0,0);
			var point_a2 = new QPointF(size,0);
			var point_a3 = new QPointF(size,height);
			var point_a4 = new QPointF(0,height);
			var points_a = new Array(point_a1, point_a2, point_a3, point_a4);
			var qpoly_a = new QPolygon(points_a);
			var poly_a = new QPolygonF(qpoly_a);
			
			var point_b1 = new QPointF(width,0);
			var point_b2 = new QPointF(width-size,0);
			var point_b3 = new QPointF(width-size,height);
			var point_b4 = new QPointF(width,height);
			var points_b = new Array(point_b1, point_b2, point_b3, point_b4);
			var qpoly_b = new QPolygon(points_b);
			var poly_b = new QPolygonF(qpoly_b);
			
			block_a = new QGraphicsPolygonItem(poly_a, 0, scene);	
			block_b = new QGraphicsPolygonItem(poly_b, 0, scene);	
			block_a.setBrush(color);
			block_b.setBrush(color);
			block_a.setOpacity(1.0);
			block_b.setOpacity(1.0);
			ui.GraphicsScene().addItem(block_a);
			ui.GraphicsScene().addItem(block_b);
		}
	},	
	
	MoveCameras: function(param)
	{
		trans = slaveclient.placeable.transform;
		var radians = sector*60*Math.PI/180;
		if (param == "forward") 
		{
			trans.pos.z -= Math.cos(radians);    
			trans.pos.x += Math.sin(radians);    
			slaveclient.placeable.transform = trans;
		}
		else if (param == "backward") 
		{
			trans.pos.z += Math.cos(radians);    
			trans.pos.x -= Math.sin(radians);    
			slaveclient.placeable.transform = trans; 
		}
		widget2.text = "Camera new z position: "+(-trans.pos.z);
		slavecamera.SetActive();
	},
	
	ResetCameras: function()
	{
		//var camera = scene.GetEntityByName("ClientCamera");
		//trans = camera.placeable.transform;
		trans = slaveclient.placeable.transform;
		trans.pos.z = 0;
		trans.pos.x = 0;
		slaveclient.placeable.transform = trans; 
		slavecamera.SetActive();
		//debug("Z: "+(-trans.pos.z));
		widget2.text = "Cameras' positions reseted";
	},		
	
	setParentEntityRef: function(attribute)
	{
		var entity = scene.GetEntityRaw(attribute);
		widget2.text = "Parent entity reference: " + entity.name;
		slaveclient.placeable.SetParent(entity, preserveWorldTransform=false);
	},

	ChangeFov: function(fov)
	{
		slavecamera.verticalFov = fov;
		//widget5.text = "Field of vision: "+fov.toFixed(2);
		widget5.text = "Field of vision: "+fov;
	},
	
	windowResized: function(rect)
	{
		if (!arrow.isNull)
			arrow.setPos(rect.width()/2-(135/2),rect.height()-pixmap_arrow.height());
		proxy.x = rect.width()-mainWidget.width-10;
	},	
	
	ChangeForwardDirection: function(sector)
	{
		ui.GraphicsScene().removeItem(arrow);
		var ID = parseInt(sector)+1;
		if (ID == client_ID) // SlaveClient's ID
		{
			this.drawForwardIndicator();
			widget2.text = "Direction of travel";
		}
		else
			widget2.text = "Direction of travel: client"+ID;
	},	

	// Create SlaveClient-entity which gets placeable data from the server
	createSlaveClient: function()
	{
		slaveclient = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);

		//slaveclient.SetName("SlaveClient");
		slaveclient.SetName("SlaveCamera");
		slaveclient.SetTemporary(true);
		var placeable = slaveclient.placeable;
		
		// set parenting reference to the Server's Void-entity
		placeable.SetParent(voidentity, preserveWorldTransform=false);
		
		Log("**** SlaveClient entity has been created with placeable, camera and name components");
	},
	
	// Set SlaveCamera parameters
	setSlaveCamera: function()
	{
		slavecamera = slaveclient.camera;
		var placeable = slaveclient.placeable;
		var transform = placeable.transform;
		
		slavecamera.verticalFov = fov;
		
		// Get client's ID number
		var regexp = /\d/;
		client_ID = regexp.exec(client.LoginProperty("username"));
		widget1.text = "Client" + client_ID + " (SlaveClient)";
		
		// Rotate camera by ID * 60 degrees (when rotated to clockwise, negative y-axis value is needed)
		transform.rot.y = -(client_ID-1) * 60;
		placeable.transform = transform;
		
		slavecamera.SetActive();
		
		Log("**** SlaveCamera has been set and rotated by " + (client_ID-1)*60 + " degrees clockwise");
		
	},
	
	createArrow: function()
	{
		arrow3 = scene.CreateLocalEntity(["EC_Placeable", "EC_Mesh"]);
		arrow3.mesh.meshRef = "assets/Arrow.mesh";
		var mats = arrow3.mesh.meshMaterial;
		mats[0] = "assets/Metal.material";
		arrow3.mesh.meshMaterial = mats;
		//arrow3.placeable.SetPosition(0,-2,-7);
		//arrow3.placeable.SetPosition(1,-0.2,-0.5);
		arrow3.placeable.SetPosition(50,20,60);
		var trans = arrow3.placeable.transform;
		//trans.rot.y = -90;
		trans.rot.x = 0;
		trans.rot.y = 60;
		trans.rot.z = 0;
		trans.scale.x = 0.5;
		trans.scale.z = 0.5;
		trans.scale.y = 0.05;
		arrow3.placeable.transform = trans;
		widget2.text = arrow3.placeable.transform;
		arrow3.placeable.SetParent(slaveclient, preserveWorldTransform=false);
	},	
	
	drawForwardIndicator: function(angle)
	{
		pixmap_arrow = new QPixmap(asset.GetAsset("arrow3b.png").DiskSource());
		arrow = ui.GraphicsScene().addPixmap(pixmap_arrow);
		rect = ui.GraphicsScene().sceneRect;
		arrow.setPos(rect.width()/2-(135/2),rect.height()-pixmap_arrow.height());
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
