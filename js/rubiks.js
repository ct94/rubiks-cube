var canvas;
var gl;
var shaderProgram;
var vertexPosition;
var vertexColor;
var modelViewMatrix = mat4.create();
var projectionMatrix = mat4.create();
var rotationMatrix = mat4.create();
var cubeVerticesBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesColorBuffer;
var cubeOutlineBuffer;
var cubeOutlineColorBuffer;

var mouseDown = false;
var x_init;
var y_init;
var x_new;
var y_new;

var CUBE_COLORS = {
    'white' : [1.0, 1.0, 1.0, 1.0],
    'red' : [1.0, 0.0, 0.0, 1.0],
    'green' : [0.0, 1.0, 0.0, 1.0],
    'blue' : [0.0, 0.0, 1.0, 1.0],
    'yellow' : [1.0, 1.0, 0.0, 1.0],
    'orange' : [1.0, 0.5, 0.0, 1.0],
    'black' : [0.0, 0.0, 0.0, 1.0]
}

function initWebGL(canvas) {
    if (!window.WebGLRenderingContext) {
        console.log("Your browser doesn't support WebGL.")
            return null;
    }
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        console.log("Your browser supports WebGL, but initialization failed.");
        return null;
    }
    return gl;
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    var source = '';
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == currentChild.TEXT_NODE) {
            source += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }
    var shader;
    if (shaderScript.type == 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log('An error occurred while compiling the shader: ' + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initShaders() {
    var fragmentShader = getShader(gl, 'fragmentShader');
    var vertexShader = getShader(gl, 'vertexShader');
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, fragmentShader);
    gl.attachShader(shaderProgram, vertexShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log('Unable to initialize the shader program');
    }
    gl.useProgram(shaderProgram);
    vertexPosition = gl.getAttribLocation(shaderProgram, 'vertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    vertexColor = gl.getAttribLocation(shaderProgram, 'vertexColor');
    gl.enableVertexAttribArray(vertexColor);
}

function initCubeBuffer() {
    // cube outline
    cubeOutlineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeOutlineBuffer);
    var cubeOutlineIndices = [
        0,  1,  2,  3,  0,
        4,  5,  6,  7,  4,
        8,  9,  10, 11, 8,
        12, 13, 14, 15, 12,
        16, 17, 18, 19, 16,
        20, 21, 22, 23, 20
    ]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeOutlineIndices), gl.STATIC_DRAW);

    // cube outline colors
    cubeOutlineColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeOutlineColorBuffer);
    var cubeOutlineColors = []
    var outlineColor = [0.0, 0.0, 0.0, 1.0];
    for (var i = 0; i < 24; i++) {
        cubeOutlineColors = cubeOutlineColors.concat(outlineColor);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeOutlineColors), gl.STATIC_DRAW);

    // cube vertices
    cubeVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    var vertices = [
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // cube faces
    cubeVerticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
    var cubeVertexIndices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23    // left
    ]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

function drawScene() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawRubiksCube();
}

function drawCube(front_color, back_color, top_color, bottom_color, right_color, left_color) {
    initCubeBuffer();
    // cube vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    // cube outline
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeOutlineColorBuffer);
    gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.lineWidth(5.0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeOutlineBuffer);
    gl.drawElements(gl.LINE_LOOP, 30, gl.UNSIGNED_SHORT, 0);
    // cube colors
    var colors = [
        CUBE_COLORS[front_color],
        CUBE_COLORS[back_color],
        CUBE_COLORS[top_color],
        CUBE_COLORS[bottom_color],
        CUBE_COLORS[right_color],
        CUBE_COLORS[left_color]
    ]
    var cubeColors = [];
    for (var i = 0; i < 6; i++) {
        var color = colors[i];
        for (var j = 0; j < 4; j++) {
            cubeColors = cubeColors.concat(color);
        }
    }
    cubeVerticesColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeColors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);
    // cube faces
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function drawRubiksCube() {
    mat4.perspective(projectionMatrix,
            30,
            canvas.width / canvas.height,
            0.1,
            100.0);
    mat4.identity(modelViewMatrix);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -10]);
    mat4.multiply(modelViewMatrix, modelViewMatrix, rotationMatrix);
    var mvMatrix = mat4.create();
    mat4.copy(mvMatrix, modelViewMatrix);
    for (var x = -1; x < 2; x++) {
        for (var y = -1; y < 2; y++) {
            for (var z = -1; z < 2; z++) {
                if (x == 0 && y == 0 && z == 0) {
                    continue;
                }
                mat4.translate(modelViewMatrix, modelViewMatrix, [2 * x, 2 * y, 2 * z]);
                drawCube('blue', 'green', 'white', 'yellow', 'orange', 'red');
                setMatrixUniforms();
                mat4.copy(modelViewMatrix, mvMatrix);
            }
        }
    }
}

function tick() {
    requestAnimationFrame(tick);
    drawScene();
}

function start() {
    canvas = document.getElementById('glcanvas');
    gl = initWebGL(canvas);
    initShaders();
    if (gl) {
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        tick();
    }
}

function setMatrixUniforms() {
    var projectionUniform = gl.getUniformLocation(shaderProgram, 'projectionMatrix');
    gl.uniformMatrix4fv(projectionUniform, false, projectionMatrix);
    var modelViewUniform = gl.getUniformLocation(shaderProgram, 'modelViewMatrix');
    gl.uniformMatrix4fv(modelViewUniform, false, modelViewMatrix);
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function rotate(event) {
    if (mouseDown) {
        x_new = event.pageX;
        y_new = event.pageY;
        delta_x = (x_new - x_init) / 10;
        delta_y = (y_new - y_init) / 10;
        var axis = [delta_y, delta_x, 0];
        var degrees = Math.sqrt(delta_x * delta_x + delta_y * delta_y);
        var newRotationMatrix = mat4.create();
        mat4.rotate(newRotationMatrix, newRotationMatrix, -degreesToRadians(degrees), axis);
        mat4.multiply(rotationMatrix, newRotationMatrix, rotationMatrix);
    }
}

function startRotate(event) {
    mouseDown = true;
    x_init = event.pageX;
    y_init = event.pageY;
}

function endRotate(event) {
    mouseDown = false;
}

$(document).ready(function() {
    start();
    $('#glcanvas').mousedown(startRotate);
    $('#glcanvas').mousemove(rotate);
    $('#glcanvas').mouseup(endRotate);
});
