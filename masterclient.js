engine.IncludeFile("local://class.js"); // from jsmodules/lib

engine.ImportExtension("qt.core");
engine.ImportExtension("qt.gui");
engine.ImportExtension("qt.webkit");


// Globals
var _p = null;
var masterclient;
var mastercamera;
var fov = 38.5; // Field of vision (45 = default, 38.5 is good in one particular setup)
var sector = 0;
var voidentity = scene.GetEntityByName("Void");
var compass = new QPixmap();
var pixmap_arrow = new QPixmap();
var arrow = new QPixmap();
var angle = 0;
var panning = 0;
var compass_angle = 0;
var distance_to_north = 10000;
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
var arrow2 = new QGraphicsPolygonItem();
var mouselook = false;

var arrow3;


var _g =
{
	connected : false,
	rotate :
	{
		sensitivity : 0.3
		//sensitivity : 1.0
	},
	move :
	{
		sensitivity : 10.0,
		//sensitivity : 20.0,
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
		
		Log("**** Creating master client objects");
		widget1.text = "Client1 (MasterClient)";

		this.setWidgetLayout();
		this.removeFreeLookCamera();
		this.createMasterClient();
		this.createArrow();
		this.setMasterCamera();
		this.setSpawnPoint();
		this.createInputHandler();
		this.drawCompass();
		//this.drawForwardIndicator();
		
		//this.MidLine();
		//this.PolyArrow();
		
		// Signals
		voidentity.Action("ChangeForwardDirectionMsg").Triggered.connect(this, this.ChangeForwardDirection);
		voidentity.Action("MoveCamerasMsg").Triggered.connect(this, this.MoveCameras);
		voidentity.Action("ResetCamerasMsg").Triggered.connect(this, this.ResetCameras);
		voidentity.Action("LetterBoxMsg").Triggered.connect(this, this.LetterBox);
		voidentity.Action("_MSG_MOVING_MODE").Triggered.connect(this, this.LetterBox);
		ui.GraphicsScene().sceneRectChanged.connect(this, this.windowResized);
        masterclient.placeable.AttributeChanged.connect(this, this.ParentEntityRefChanged);	
	},
	
	createArrow: function()
	{
		arrow3 = scene.CreateLocalEntity(["EC_Placeable", "EC_Mesh"]);
		arrow3.mesh.meshRef = "assets/Arrow.mesh";
		var mats = arrow3.mesh.meshMaterial;
		mats[0] = "assets/Metal.material";
		arrow3.mesh.meshMaterial = mats;
		//arrow3.placeable.SetPosition(0,-2,-7);
		arrow3.placeable.SetParent(voidentity, preserveWorldTransform=false);
		arrow3.placeable.SetPosition(0,-0.75,-3);
		var trans = arrow3.placeable.transform;
		trans.rot.y = -90;
		trans.scale.x = 0.5;
		trans.scale.z = 0.5;
		trans.scale.y = 0.05;
		arrow3.placeable.transform = trans;
		widget2.text = arrow3.placeable.transform;
		//arrow3.placeable.SetParent(voidentity, preserveWorldTransform=true);
	},
	
	ParentEntityRefChanged: function(attribute)
	{
		widget4.text = attribute.name;
		if (attribute.name === "Parent entity ref")
		{
			voidentity.Exec(4, "ChangeParentEntityRefMsg", attribute.value);
			widget2.text = "Parent entity reference: " + (scene.GetEntityRaw(attribute.value)).name;
		}
	},
	
	setWidgetLayout: function()
	{
		var layout = new QVBoxLayout();
		mainWidget.setLayout(layout);
		//mainWidget.setFixedWidth(250);
		mainWidget.setFixedWidth(650);
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
	
	MidLine: function()
	{
		var mainwin = ui.MainWindow();
		var height = mainwin.size.height();
		var width = mainwin.size.width();	
		var point_a1 = new QPointF(width/2,0);
		//var point_a2 = new QPointF((width/2)+5,0);
		//var point_a3 = new QPointF((width/2)+5,height);
		//var point_a4 = new QPointF((width/2),height);
		var point_a2 = new QPointF((width/2),height);
		var points_a = new Array(point_a1, point_a2);
		//var points_a = new Array(point_a1, point_a2, point_a3, point_a4);
		var qpoly_a = new QPolygon(points_a);
		var poly_a = new QPolygonF(qpoly_a);
		block_a = new QGraphicsPolygonItem(poly_a, 0, scene);	
		var color = new QColor("black");
		block_a.setBrush(color);
		block_a.setOpacity(1.0);
		ui.GraphicsScene().addItem(block_a);		
	},
	
	PolyArrow: function()
	{
		var mainwin = ui.MainWindow();
		//var height = mainwin.size.height();
		//var width = mainwin.size.width();	
		var height = 100;
		var width = 200;
		var point_a1 = new QPointF(0, height);
		var point_a2 = new QPointF((width/4),height/2);
		var point_a3 = new QPointF(0,height/2);
		var point_a4 = new QPointF((width/2),0);
		var point_a5 = new QPointF(width,height/2);
		var point_a6 = new QPointF(width-(width/4),height/2);
		var point_a7 = new QPointF(width,height);
		//var points_a = new Array(point_a1, point_a2);
		var points_a = new Array(point_a1, point_a2, point_a3, point_a4, point_a5, point_a6, point_a7);
		var qpoly_a = new QPolygon(points_a);
		var poly_a = new QPolygonF(qpoly_a);
		arrow2 = new QGraphicsPolygonItem(poly_a, 0, scene);	
		var color = new QColor("blue");
		arrow2.setBrush(color);
		arrow2.setOpacity(0.4);
		ui.GraphicsScene().addItem(arrow2);
		arrow2.setPos(rect.width()/2-(200/2), rect.height()-100);
		arrow2.setTransformOriginPoint(width/2, height/2);		
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
		trans = masterclient.placeable.transform;
		var radians = sector*60*Math.PI/180;

		if (param == "forward") 
		{
			trans.pos.z -= Math.cos(radians);    
			trans.pos.x += Math.sin(radians);    
			masterclient.placeable.transform = trans;
		}
		else if (param == "backward") 
		{
			trans.pos.z += Math.cos(radians);    
			trans.pos.x -= Math.sin(radians);    
			masterclient.placeable.transform = trans; 
		}
		widget2.text = "Camera new z position: "+(-trans.pos.z);
		mastercamera.SetActive();
	},
	
	ResetCameras: function()
	{
		//var camera = scene.GetEntityByName("ClientCamera");
		//trans = camera.placeable.transform;
		trans = masterclient.placeable.transform;
		trans.pos.z = 0;
		trans.pos.x = 0;
		masterclient.placeable.transform = trans; 
		mastercamera.SetActive();
		//debug("Z: "+(-trans.pos.z));
		widget2.text = "Cameras' positions reseted";
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
		if (!arrow.isNull)
			arrow.setPos(rect.width()/2-(135/2),rect.height()-pixmap_arrow.height());
		proxy.x = rect.width()-mainWidget.width-10;
	},
	
	WindowResizeListener: function(widg, callbackFunction)
	{
		widg.WindowResized = callbackFunction;
		var gscene = ui.GraphicsScene().scene();
		gscene.sceneRectChanged.connect(widg, widg.WindowResized);		
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

		//masterclient.SetName("MasterClient");
		masterclient.SetName("MasterCamera");
		masterclient.SetTemporary(true);
		var placeable = masterclient.placeable;
		
		// set parenting reference to the Server's Void-entity
		placeable.SetParent(voidentity, preserveWorldTransform=false);
		
		Log("**** MasterClient entity has been created with placeable, camera and name components");
	},

	// Set MasterCamera parameters
	setMasterCamera: function()
	{
		mastercamera = masterclient.camera;
		
		mastercamera.verticalFov = fov;
		mastercamera.SetActive();
		widget5.text = "Field of vision: "+fov.toFixed(2);
	},
	
	// Set initial spawn point
	setSpawnPoint: function()
	{
		var void_placeable = voidentity.placeable;
		var void_transform = void_placeable.transform;
		void_transform.pos = new float3(0, 10, 0);
		voidentity.placeable.transform = void_transform;
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
		var radians = (sector)*60*Math.PI/180;
		//var radians2 = (Math.abs(panning)/(rect.width()/2))*60*Math.PI/180;
		//var radians2 = (panning/(rect.width()/2))*60*Math.PI/180;
		var radians2 = (panning)*Math.PI/180;
		
		// forward
		if (e.keyCode == Qt.Key_W)
		{
			if (panning != 0)
			{
				_g.move.amount.z = -Math.cos(radians2);
				_g.move.amount.x = Math.sin(radians2);
				widget5.text = radians2;
			}
			//if (mouselook && sector == 0)
			else if (mouselook && sector == 0)
				_g.move.amount.z = -1;
			else
			{
				_g.move.amount.z = -Math.cos(radians);
				_g.move.amount.x = Math.sin(radians);
			}
		}
		
		// backward
		else if (e.keyCode == Qt.Key_S)
		{
			if (mouselook && sector == 0)
				_g.move.amount.z = 1;
			else
			{
				_g.move.amount.z = Math.cos(radians);
				_g.move.amount.x = -Math.sin(radians);
			}
		}
		
		// right
		else if (e.keyCode == Qt.Key_D)
		{
			if (mouselook && sector == 0)
				_g.move.amount.x = 1;
			else
			{
				_g.move.amount.z = Math.sin(radians);
				_g.move.amount.x = Math.cos(radians);
			}
			angle+=(Math.atan(Math.cos(radians)/distance_to_north))*(180/Math.PI);
			if (angle > 360)
				angle -= 360;
			compass_angle = -angle;
			compass.setRotation(compass_angle);
			widget4.text = "Bearing: " +(angle).toFixed(2);
		}
		
		// left
		else if (e.keyCode == Qt.Key_A)
		{
			if (mouselook && sector == 0)
				_g.move.amount.x = -1;
			else
			{
				_g.move.amount.z = -Math.sin(radians);
				_g.move.amount.x = -Math.cos(radians);
				angle-=(Math.atan(Math.cos(radians)/distance_to_north))*(180/Math.PI);
				if (angle < 0)
					angle += 360;
				compass_angle = -angle;
				compass.setRotation(compass_angle);
				widget4.text = "Bearing: " + (angle).toFixed(2);
			}
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
			if (sector < 5)
				sector++;
			else
				sector = 0;
			angle = sector*60;
			voidentity.Exec(5, "ChangeForwardDirectionMsg", sector);
			compass_angle = -angle;
			compass.setRotation(compass_angle);
			widget3.text = "Sector: "+sector;
			widget4.text = "Bearing: " +parseInt(angle);
		}
		
		// change sector -
		else if (e.keyCode == Qt.Key_Minus)
		{
			if (sector > 0)
				sector--;
			else
				sector = 5;
			angle = sector*60;
			voidentity.Exec(5, "ChangeForwardDirectionMsg", sector);
			compass_angle = -angle;
			compass.setRotation(compass_angle);
			widget3.text = "Sector: "+sector;
			widget4.text = "Bearing: " +parseInt(angle);
		}
		
		// increse vertical fov
		else if (e.keyCode == Qt.Key_Insert)
		{
			fov += 1.0;
			mastercamera.verticalFov = fov;
			widget5.text = "Field of vision: "+fov.toFixed(2);
			voidentity.Exec(4, "ChangeFovMsg", fov);	// 4=peers
		}
		
		// minor increse vertical fov
		else if (e.keyCode == Qt.Key_Home)
		{
			fov += 0.05;
			mastercamera.verticalFov = fov;
			widget5.text = "Field of vision: "+fov.toFixed(2);
			voidentity.Exec(4, "ChangeFovMsg", fov);
		}		
		
		// decrease vertical fov
		else if (e.keyCode == Qt.Key_Delete)
		{
			fov -= 1.0;
			mastercamera.verticalFov = fov;
			widget5.text = "Field of vision: "+fov.toFixed(2);
			voidentity.Exec(4, "ChangeFovMsg", fov);
		}
		
		// minor decrease vertical fov
		else if (e.keyCode == Qt.Key_End)
		{
			fov -= 0.05;
			mastercamera.verticalFov = fov;
			widget5.text = "Field of vision: "+fov.toFixed(2);
			voidentity.Exec(5, "ChangeFovMsg", fov);
		}			

		// Reset direction
		else if (e.keyCode == Qt.Key_N)
		{
			var transform = voidentity.placeable.transform;
			transform.rot.y = 0;
			voidentity.placeable.transform = transform;
			sector = 0;
			angle = 0;
			compass_angle = -angle;
			compass.setRotation(compass_angle);			
			widget3.text = "Sector: "+sector;
			widget4.text = "Bearing: " +parseInt(angle);
			voidentity.Exec(5, "ChangeForwardDirectionMsg", sector);
		}
		
		// Move cameras forward
		else if (e.keyCode == Qt.Key_PageUp)
			voidentity.Exec(5, "MoveCamerasMsg", "forward");
		
		// Move cameras backward
		else if (e.keyCode == Qt.Key_PageDown)
			voidentity.Exec(5, "MoveCamerasMsg", "backward");
		
		// Reset cameras positions
		else if (e.keyCode == Qt.Key_R)
			voidentity.Exec(5, "ResetCamerasMsg");
		
		// Increase black block size
		else if (e.keyCode == Qt.Key_L)
		{
			block_size += 5;
			voidentity.Exec(5, "LetterBoxMsg", block_size);
		}

		// Reset black block size
		else if (e.keyCode == Qt.Key_K)
		{
			block_size = 0;
			voidentity.Exec(5, "LetterBoxMsg", block_size);
		}

		// Moving mode: mode1
		else if (e.keyCode == Qt.Key_1)
			voidentity.Exec(5, "_MSG_MOVING_MODE", "mode1");

		// Moving mode: mode2
		else if (e.keyCode == Qt.Key_2)
			voidentity.Exec(5, "_MSG_MOVING_MODE", "mode2");
	},
	
	// Handler for key release commands
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
		var transform = voidentity.placeable.transform;
		transform.rot.y -= _g.rotate.sensitivity * parseInt(param);
		voidentity.placeable.transform = transform;
		if ((angle+_g.rotate.sensitivity * parseInt(param)) > 360)
			angle += (_g.rotate.sensitivity * parseInt(param)) - 360;
		else if ((angle+_g.rotate.sensitivity * parseInt(param)) < 0)
			angle += (_g.rotate.sensitivity * parseInt(param)) + 360;
		else
			angle += _g.rotate.sensitivity * parseInt(param);
		compass_angle = -angle;
		compass.setRotation(compass_angle);
		widget4.text = "Bearing: " +angle.toFixed(2);
	},

	// Handler for mouse y axis relative movement
	HandleMouseLookY: function(param)
	{
		var transform = voidentity.placeable.transform;
		var radians = (sector-1)*60*Math.PI/180;
		transform.rot.x -= _g.rotate.sensitivity * parseInt(param);
		if (transform.rot.x > 90.0)
			transform.rot.x = 90.0;
		if (transform.rot.x < -90.0)
			transform.rot.x = -90.0;
		voidentity.placeable.transform = transform;
	},
	
	HandleMousePan: function(param)
	{
		//panning = -90-((panning+param)/(rect.width())*30);
		//panning = panning+(param/rect.width()*60);
		var increase = param/rect.width()*60;
		var increase = param/rect.width()*120;
		if (param < 0 && panning+increase < 10 && panning+increase > 0)	// snap to zero
			panning = 0;
		else if (param > 0 && panning+increase > 350)			// snap to zero
			panning = 0;
		//else if (panning+(param/rect.width()*60) < 0)
		else if (panning+increase < 0)
			panning = 360+increase;
		//else if (panning+(param/rect.width()*60) > 360)
		else if (panning+increase > 360)
			//panning = (param/rect.width()*60);
			panning = increase;
		else
			//panning = panning+(param/rect.width()*60);
			panning = panning+increase;
		widget4.text = "Panning: " +panning.toFixed(2);
		var trans = arrow3.placeable.transform;
		trans.rot.y = -90-panning;
		arrow3.placeable.transform = trans;
	},
	
	statusWidget: function(message, row)
	{
		if (typeof(row)==='undefined') 
			row=0;
		label.indent = 10;
		label.text = message;
		label.setStyleSheet("QLabel {background-color: transparent; color: white; font-size: 16px; }");
		proxy.x = 10;
		proxy.y = 200+row*20;
		proxy.windowFlags = 0;
		proxy.visible = true;
		/**/
	},
	
	drawCompass: function()
	{
		var pixmap_compass = new QPixmap(asset.GetAsset("compassd.png").DiskSource());
		var pixmap_needle = new QPixmap(asset.GetAsset("needle.png").DiskSource());
		compass = ui.GraphicsScene().addPixmap(pixmap_compass);
		var needle = ui.GraphicsScene().addPixmap(pixmap_needle);
		//compass.setTransformOriginPoint(pixmap_compass.height()/2, pixmap_compass.width()/2);
		compass.setTransformOriginPoint(pixmap_compass.width()/2, pixmap_compass.height()/2);
	},
	
	drawForwardIndicator: function(angle)
	{
		pixmap_arrow = new QPixmap(asset.GetAsset("arrow3b.png").DiskSource());
		arrow = ui.GraphicsScene().addPixmap(pixmap_arrow);
		rect = ui.GraphicsScene().sceneRect;
		arrow.setPos(rect.width()/2-(135/2),rect.height()-pixmap_arrow.height());
		//arrow.setTransformOriginPoint(pixmap_arrow.height()/2, pixmap_arrow.width()/2);
		///arrow.setTransformOriginPoint(pixmap_arrow.width()/2, pixmap_arrow.height());
		arrow.setTransformOriginPoint(pixmap_arrow.width()/2, (pixmap_arrow.height())*4);
		//arrow.setTransformOriginPoint((pixmap_arrow.height()), (pixmap_arrow.width())/2);
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
