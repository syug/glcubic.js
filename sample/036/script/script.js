var qt = gl3.qtn.create();
gl3.qtn.identity(qt);

window.onload = function(){
	// initialize
	gl3.initGL('canvas');
	if(!gl3.ready){console.log('initialize error'); return;}

	// canvas size
	var canvasSize = Math.min(window.innerWidth, window.innerHeight);
	gl3.canvas.width  = canvasSize;
	gl3.canvas.height = canvasSize;

	// event
	gl3.canvas.addEventListener('mousemove', mouseMove, true);

	// texture load
	gl3.create_texture('image/earth.png',  0, loadCheck);
	gl3.create_texture('image/cloud.png', 1, loadCheck);

	// load check function
	function loadCheck(){
		var load = true;
		for(var i = 0; i < 2; i++){
			if(gl3.textures[i] != null){
				load = load && gl3.textures[i].loaded;
			}else{
				load = false;
				break;
			}
		}
		if(load){init();}
	}
};

function init(){
	// texture unit zero
	gl3.gl.activeTexture(gl3.gl.TEXTURE0);
	gl3.gl.bindTexture(gl3.gl.TEXTURE_2D, gl3.textures[0].texture);

	// texture unit one
	gl3.gl.activeTexture(gl3.gl.TEXTURE1);
	gl3.gl.bindTexture(gl3.gl.TEXTURE_2D, gl3.textures[1].texture);

	// program
	var prg = gl3.program.create(
		'vs',
		'fs',
		['position', 'normal', 'color', 'texCoord'],
		[3, 3, 4, 2],
		['mMatrix', 'mvpMatrix', 'invMatrix', 'lightPosition', 'eyePosition', 'centerPoint', 'ambientColor', 'textureUnit', 'texture', 'texture2'],
		['matrix4fv', 'matrix4fv', 'matrix4fv', '3fv', '3fv', '3fv', '4fv', '1i', '1i', '1i']
	);

	// sphere mesh
	var sphereData = gl3.mesh.sphere(32, 32, 1.0, [1.0, 1.0, 1.0, 1.0]);
	var sphereVBO = [
		gl3.create_vbo(sphereData.position),
		gl3.create_vbo(sphereData.normal),
		gl3.create_vbo(sphereData.color),
		gl3.create_vbo(sphereData.texCoord)
	];
	var sphereIBO = gl3.create_ibo(sphereData.index);

	// matrix
	mMatrix = gl3.mat4.identity(gl3.mat4.create());
	vMatrix = gl3.mat4.identity(gl3.mat4.create());
	pMatrix = gl3.mat4.identity(gl3.mat4.create());
	vpMatrix = gl3.mat4.identity(gl3.mat4.create());
	mvpMatrix = gl3.mat4.identity(gl3.mat4.create());
	invMatrix = gl3.mat4.identity(gl3.mat4.create());

	// depth test
	gl3.gl.enable(gl3.gl.DEPTH_TEST);
	gl3.gl.depthFunc(gl3.gl.LEQUAL);
	gl3.gl.clearDepth(1.0);

	// culling
	gl3.gl.enable(gl3.gl.CULL_FACE);

	// rendering
	var count = 0;
	render();

	function render(){
		count++;

		var lightPosition = [0.0, 2.0, 0.0];
		var cameraPosition = [];
		var centerPoint = [0.0, 0.0, 0.0];
		var cameraUpDirection = [];
		gl3.qtn.toVecIII([0.0, 0.0, 10.0], qt, cameraPosition);
		gl3.qtn.toVecIII([0.0, 1.0, 0.0], qt, cameraUpDirection);
		var camera = gl3.camera.create(
			cameraPosition,
			centerPoint,
			cameraUpDirection,
			45, 1.0, 0.1, 20.0
		);
		gl3.scene_clear([0.3, 0.3, 0.3, 1.0], 1.0);
		gl3.scene_view(camera, 0, 0, gl3.canvas.width, gl3.canvas.height);
		gl3.mat4.vpFromCamera(camera, vMatrix, pMatrix, vpMatrix);

		// sphere rendering
		prg.set_program();
		prg.set_attribute(sphereVBO, sphereIBO);
		var ambientColor = [0.1, 0.1, 0.1, 0.0];
		var radian = gl3.TRI.rad[count % 360];
		var axis = [0.0, 1.0, 0.0];

		// first
		gl3.gl.cullFace(gl3.gl.BACK);
		var offset = [2.0, 0.0, 0.0];
		gl3.mat4.identity(mMatrix);
		gl3.mat4.translate(mMatrix, offset, mMatrix);
		gl3.mat4.rotate(mMatrix, radian, axis, mMatrix);
		gl3.mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
		gl3.mat4.inverse(mMatrix, invMatrix);
		prg.push_shader([mMatrix, mvpMatrix, invMatrix, lightPosition, cameraPosition, centerPoint, ambientColor, 0, 0, 1]);
		gl3.draw_elements(gl3.gl.TRIANGLES, sphereData.index.length);

		// second
		gl3.gl.cullFace(gl3.gl.FRONT);
		offset = [-2.0, 0.0, 0.0];
		gl3.mat4.identity(mMatrix);
		gl3.mat4.translate(mMatrix, offset, mMatrix);
		gl3.mat4.rotate(mMatrix, radian, axis, mMatrix);
		gl3.mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
		gl3.mat4.inverse(mMatrix, invMatrix);
		prg.push_shader([mMatrix, mvpMatrix, invMatrix, lightPosition, cameraPosition, centerPoint, ambientColor, 1, 0, 1]);
		gl3.draw_elements(gl3.gl.TRIANGLES, sphereData.index.length);

		requestAnimationFrame(render);
	}
}

function mouseMove(eve) {
	var cw = gl3.canvas.width;
	var ch = gl3.canvas.height;
	var wh = 1 / Math.sqrt(cw * cw + ch * ch);
	var x = eve.clientX - gl3.canvas.offsetLeft - cw * 0.5;
	var y = eve.clientY - gl3.canvas.offsetTop - ch * 0.5;
	var sq = Math.sqrt(x * x + y * y);
	var r = sq * 2.0 * Math.PI * wh;
	if (sq != 1) {
		sq = 1 / sq;
		x *= sq;
		y *= sq;
	}
	gl3.qtn.rotate(r, [y, x, 0.0], qt);
}