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

    // program
    // var prg = gl3.program.create(
    //     'vs',
    //     'fs',
    //     ['position', 'normal', 'color'],
    //     [3, 3, 4],
    //     ['mvpMatrix', 'invMatrix', 'lightDirection', 'eyePosition', 'centerPoint'],
    //     ['matrix4fv', 'matrix4fv', '3fv', '3fv', '3fv']
    // );
    var prg = gl3.program.create_from_file(
        'shader/vs.vert',
        'shader/fs.frag',
        ['position', 'normal', 'color'],
        [3, 3, 4],
        ['mvpMatrix', 'invMatrix', 'lightDirection', 'eyePosition', 'centerPoint'],
        ['matrix4fv', 'matrix4fv', '3fv', '3fv', '3fv'],
        setting
    );

    // declare var
    var torusData;
    var VBO, IBO;
    var count = 0;

    function setting(){
        // mesh data
        torusData = gl3.mesh.torus(64, 64, 0.3, 0.7);

        // vertex buffer object
        VBO = [
            gl3.create_vbo(torusData.position),
            gl3.create_vbo(torusData.normal),
            gl3.create_vbo(torusData.color)
        ];
        IBO = gl3.create_ibo(torusData.index);

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

        // rendering
        render();
    }

    function render(){
        count++;

        var lightDirection = [1.0, 1.0, 1.0];
        var cameraPosition = [];
        var centerPoint = [0.0, 0.0, 0.0];
        var cameraUpDirection = [];
        gl3.qtn.toVecIII([0.0, 0.0, 5.0], qt, cameraPosition);
        gl3.qtn.toVecIII([0.0, 1.0, 0.0], qt, cameraUpDirection);
        var camera = gl3.camera.create(
            cameraPosition,
            centerPoint,
            cameraUpDirection,
            45, 1.0, 0.1, 10.0
        );
        gl3.scene_clear([0.3, 0.3, 0.3, 1.0], 1.0);
        gl3.scene_view(camera, 0, 0, gl3.canvas.width, gl3.canvas.height);
        gl3.mat4.vpFromCamera(camera, vMatrix, pMatrix, vpMatrix);

        prg.set_program();
        prg.set_attribute(VBO, IBO);

        var radian = gl3.TRI.rad[count % 360];
        var axis = [0.0, 1.0, 0.0];
        gl3.mat4.identity(mMatrix);
        gl3.mat4.rotate(mMatrix, radian, axis, mMatrix);
        gl3.mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
        gl3.mat4.inverse(mMatrix, invMatrix);

        prg.push_shader([
            mvpMatrix,
            invMatrix,
            lightDirection,
            cameraPosition,
            centerPoint
        ]);

        gl3.draw_elements(gl3.gl.TRIANGLES, torusData.index.length);

        requestAnimationFrame(render);
    }
};

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
