/* =========================================================
   NAOS Electromecánica — motor 3D del hero
   Escena Three.js: bloque motor con pistones y cigüeñal en
   movimiento, rueda dentada (guiño al logotipo) y rayo.
   Rotación cinematográfica automática, sin interacción.
   ========================================================= */
(function (global) {
  'use strict';

  var THREE = global.THREE;

  /* ---------- utilidades de geometría ---------- */

  // Caja con esquinas redondeadas (ancho X, alto Y, fondo Z)
  function roundedBox(w, h, d, r) {
    r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
    var s = new THREE.Shape();
    var x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);

    var g = new THREE.ExtrudeGeometry(s, {
      depth: d - 0.04, bevelEnabled: true, bevelThickness: 0.02,
      bevelSize: 0.02, bevelSegments: 2, curveSegments: 6
    });
    g.translate(0, 0, -(d - 0.04) / 2);
    g.computeVertexNormals();
    return g;
  }

  // Cilindro tumbado sobre el eje X
  function axleGeo(radius, length, seg) {
    var g = new THREE.CylinderGeometry(radius, radius, length, seg || 24);
    g.rotateZ(Math.PI / 2);
    return g;
  }

  // Rueda dentada tipo engranaje (guiño al emblema NAOS)
  function gearGeo(rOut, rRoot, teeth, holeR, depth, lightening) {
    var shape = new THREE.Shape();
    var step = (Math.PI * 2) / teeth;
    for (var i = 0; i < teeth; i++) {
      var a0 = i * step;
      var a1 = a0 + step * 0.30;
      var a2 = a0 + step * 0.50;
      var a3 = a0 + step * 0.80;
      var pts = [
        [rRoot, a0], [rOut, a1], [rOut, a2], [rRoot, a3], [rRoot, a0 + step]
      ];
      for (var p = 0; p < pts.length; p++) {
        var x = Math.cos(pts[p][1]) * pts[p][0];
        var y = Math.sin(pts[p][1]) * pts[p][0];
        if (i === 0 && p === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
      }
    }
    shape.closePath();
    var hole = new THREE.Path();
    hole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    // aligeramientos opcionales (agujeros circulares en el alma)
    if (lightening) {
      for (var l = 0; l < lightening.count; l++) {
        var la = (l / lightening.count) * Math.PI * 2;
        var lh = new THREE.Path();
        lh.absarc(Math.cos(la) * lightening.dist, Math.sin(la) * lightening.dist,
                  lightening.radius, 0, Math.PI * 2, true);
        shape.holes.push(lh);
      }
    }

    var g = new THREE.ExtrudeGeometry(shape, {
      depth: depth, bevelEnabled: true, bevelThickness: 0.025,
      bevelSize: 0.025, bevelSegments: 2, curveSegments: 18
    });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return g;
  }

  // Rayo (el del emblema) como forma extruida
  function boltGeo(scale, depth) {
    var pts = [
      [0.42, 1.00], [-0.22, 0.12], [0.10, 0.10],
      [-0.34, -1.00], [0.30, -0.06], [-0.04, -0.04]
    ];
    var s = new THREE.Shape();
    for (var i = 0; i < pts.length; i++) {
      var x = pts[i][0] * scale, y = pts[i][1] * scale;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
    s.closePath();
    var g = new THREE.ExtrudeGeometry(s, {
      depth: depth, bevelEnabled: true, bevelThickness: 0.015,
      bevelSize: 0.015, bevelSegments: 1, curveSegments: 2
    });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return g;
  }

  // Entorno de estudio procedural (sin descargar HDRI)
  function studioEnvTexture() {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    var ctx = c.getContext('2d');

    var base = ctx.createLinearGradient(0, 0, 0, 256);
    base.addColorStop(0.00, '#0d1417');
    base.addColorStop(0.42, '#1b262b');
    base.addColorStop(0.58, '#0a0f11');
    base.addColorStop(1.00, '#05080a');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 256);

    // dos paneles de luz blancos (los reflejos largos del metal)
    function panel(x, y, w, h, alpha) {
      var g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,' + alpha + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }
    panel(40, 22, 180, 72, 0.82);
    panel(300, 38, 150, 54, 0.42);

    // acento verde de marca en los reflejos
    var gr = ctx.createRadialGradient(470, 150, 6, 470, 150, 130);
    gr.addColorStop(0, 'rgba(77,184,124,0.8)');
    gr.addColorStop(1, 'rgba(77,184,124,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(340, 20, 172, 236);

    var gr2 = ctx.createRadialGradient(60, 170, 4, 60, 170, 110);
    gr2.addColorStop(0, 'rgba(15,138,67,0.6)');
    gr2.addColorStop(1, 'rgba(15,138,67,0)');
    ctx.fillStyle = gr2;
    ctx.fillRect(0, 60, 170, 196);

    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Disco de luz difusa bajo el motor
  function glowTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(128, 128, 4, 128, 128, 126);
    g.addColorStop(0.00, 'rgba(77,184,124,0.5)');
    g.addColorStop(0.35, 'rgba(15,138,67,0.22)');
    g.addColorStop(1.00, 'rgba(15,138,67,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  /* ---------- escena ---------- */

  function init(canvas) {
    if (!THREE || !canvas) return null;

    var host = canvas.parentElement || canvas;
    var W = host.clientWidth || 1;
    var H = host.clientHeight || 1;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
      });
    } catch (e) { return null; }

    var isSmall = global.matchMedia('(max-width: 760px)').matches;
    var reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, isSmall ? 1.6 : 2));
    renderer.setSize(W, H, false);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
    camera.position.set(0, 1.4, 16);
    camera.lookAt(0, 0.85, 0);

    // entorno
    var pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    var envSrc = studioEnvTexture();
    var envRT = pmrem.fromEquirectangular(envSrc);
    scene.environment = envRT.texture;
    envSrc.dispose();
    pmrem.dispose();

    /* ---------- materiales ---------- */
    var mGraphite = new THREE.MeshStandardMaterial({ color: 0x1b2226, metalness: 0.94, roughness: 0.36 });
    var mDark     = new THREE.MeshStandardMaterial({ color: 0x0e1316, metalness: 0.82, roughness: 0.52 });
    var mAlu      = new THREE.MeshStandardMaterial({ color: 0xa9b3b7, metalness: 1.00, roughness: 0.26 });
    var mAluDark  = new THREE.MeshStandardMaterial({ color: 0x6f797d, metalness: 1.00, roughness: 0.36 });
    // verdes derivados del color corporativo del logotipo (#0A803A)
    var mGreen    = new THREE.MeshStandardMaterial({
      color: 0x0c8a41, metalness: 0.74, roughness: 0.22,
      emissive: 0x032a12, emissiveIntensity: 0.2
    });
    var mGreenDeep = new THREE.MeshStandardMaterial({
      color: 0x0a7a39, metalness: 0.76, roughness: 0.3,
      emissive: 0x05301a, emissiveIntensity: 0.3
    });
    var mGreenGlow = new THREE.MeshStandardMaterial({
      color: 0x4db87c, metalness: 0.3, roughness: 0.25,
      emissive: 0x4db87c, emissiveIntensity: 0.9
    });
    var mRed = new THREE.MeshStandardMaterial({
      color: 0xd8392d, metalness: 0.4, roughness: 0.3,
      emissive: 0xd8392d, emissiveIntensity: 0.75
    });
    var mGlass = new THREE.MeshPhysicalMaterial({
      color: 0x8fdcb2, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.09,
      side: THREE.DoubleSide, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04
    });

    /* ---------- parámetros mecánicos ---------- */
    var XS      = [-1.32, -0.44, 0.44, 1.32];   // eje de cada cilindro
    var PHASE   = [0, Math.PI, Math.PI, 0];      // orden de encendido 1-3-4-2
    var CRANK_Y = -0.25;                          // centro del cigüeñal
    var THROW   = 0.34;                           // radio de muñequilla
    var ROD_L   = 1.50;                           // longitud de biela

    var root = new THREE.Group();
    scene.add(root);

    var engine = new THREE.Group();
    root.add(engine);

    /* ---------- bloque y cárter ---------- */
    var block = new THREE.Mesh(roundedBox(3.5, 1.15, 1.9, 0.14), mGraphite);
    block.position.y = -0.50;
    block.castShadow = block.receiveShadow = true;
    engine.add(block);

    var pan = new THREE.Mesh(roundedBox(3.05, 0.55, 1.5, 0.14), mDark);
    pan.position.y = -1.32;
    pan.castShadow = true;
    engine.add(pan);

    var rail = new THREE.Mesh(roundedBox(3.6, 0.12, 2.0, 0.05), mAluDark);
    rail.position.y = 0.12;
    rail.castShadow = true;
    engine.add(rail);

    // nervios laterales del bloque
    for (var rib = 0; rib < 6; rib++) {
      var rg = new THREE.Mesh(roundedBox(0.1, 0.9, 1.96, 0.03), mDark);
      rg.position.set(-1.45 + rib * 0.58, -0.52, 0);
      engine.add(rg);
    }

    // columnas de unión bloque–culata (aspecto de banco de pruebas)
    var postGeo = new THREE.CylinderGeometry(0.055, 0.055, 2.15, 14);
    [[-1.72, 0.82], [1.72, 0.82], [-1.72, -0.82], [1.72, -0.82]].forEach(function (p) {
      var post = new THREE.Mesh(postGeo, mAluDark);
      post.position.set(p[0], 1.14, p[1]);
      post.castShadow = true;
      engine.add(post);
    });

    /* ---------- culata, tapa de balancines y admisión ---------- */
    var head = new THREE.Mesh(roundedBox(3.5, 0.24, 1.7, 0.08), mAluDark);
    head.position.y = 2.24;
    head.castShadow = head.receiveShadow = true;
    engine.add(head);

    var cover = new THREE.Mesh(roundedBox(3.2, 0.44, 1.05, 0.12), mGreen);
    cover.position.y = 2.58;
    cover.castShadow = true;
    engine.add(cover);

    for (var cr = 0; cr < 7; cr++) {
      var crib = new THREE.Mesh(roundedBox(0.07, 0.1, 1.0, 0.02), mGreen);
      crib.position.set(-1.35 + cr * 0.45, 2.82, 0);
      engine.add(crib);
    }

    var boltGeoSm = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12);
    for (var bz = -1; bz <= 1; bz += 2) {
      for (var bi = 0; bi < 6; bi++) {
        var bolt = new THREE.Mesh(boltGeoSm, mAlu);
        bolt.position.set(-1.45 + bi * 0.58, 2.38, bz * 0.72);
        engine.add(bolt);
      }
    }

    // colector de admisión: plenum + 4 trompetas
    var plenum = new THREE.Mesh(roundedBox(2.7, 0.36, 0.5, 0.16), mAluDark);
    plenum.position.set(0, 3.05, 0.95);
    plenum.castShadow = true;
    engine.add(plenum);

    for (var t = 0; t < 4; t++) {
      var curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(XS[t], 3.02, 0.78),
        new THREE.Vector3(XS[t], 2.96, 0.58),
        new THREE.Vector3(XS[t], 2.72, 0.50)
      ]);
      var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.085, 12, false), mAlu);
      tube.castShadow = true;
      engine.add(tube);
    }

    // colector de escape: cuatro primarios que bajan a un colector común
    for (var e = 0; e < 4; e++) {
      var ec = new THREE.CatmullRomCurve3([
        new THREE.Vector3(XS[e], 2.30, -0.80),
        new THREE.Vector3(XS[e], 2.05, -1.18),
        new THREE.Vector3(XS[e] * 0.72, 1.30, -1.34),
        new THREE.Vector3(XS[e] * 0.34, 0.55, -1.30),
        new THREE.Vector3(0, 0.15, -1.26)
      ]);
      var ep = new THREE.Mesh(new THREE.TubeGeometry(ec, 30, 0.10, 12, false), mAluDark);
      ep.castShadow = true;
      engine.add(ep);
    }
    var collector = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.75, 22), mAluDark);
    collector.position.set(0, -0.22, -1.26);
    collector.castShadow = true;
    engine.add(collector);

    /* ---------- cilindros, pistones y bielas ---------- */
    var sleeveGeo = new THREE.CylinderGeometry(0.44, 0.44, 1.52, 40, 1, true);
    var ringGeo   = new THREE.TorusGeometry(0.445, 0.022, 8, 40);
    var collarGeo = new THREE.CylinderGeometry(0.50, 0.50, 0.14, 36);

    var crownGeo  = new THREE.CylinderGeometry(0.40, 0.40, 0.30, 36);
    var pRingGeo  = new THREE.CylinderGeometry(0.405, 0.405, 0.035, 36);
    var skirtGeo  = new THREE.CylinderGeometry(0.385, 0.36, 0.20, 28);
    var pinGeo    = axleGeo(0.07, 0.52, 14);

    var rodBodyGeo = roundedBox(0.17, ROD_L - 0.18, 0.12, 0.06);
    var rodBigGeo  = new THREE.TorusGeometry(0.17, 0.062, 10, 26);
    var rodSmGeo   = new THREE.TorusGeometry(0.10, 0.05, 10, 22);
    rodBigGeo.rotateY(Math.PI / 2);
    rodSmGeo.rotateY(Math.PI / 2);

    var pistons = [];
    var rods = [];

    for (var i = 0; i < 4; i++) {
      var x = XS[i];

      var collar = new THREE.Mesh(collarGeo, mAluDark);
      collar.position.set(x, 0.62, 0);
      collar.castShadow = true;
      engine.add(collar);

      var sleeve = new THREE.Mesh(sleeveGeo, mGlass);
      sleeve.position.set(x, 1.41, 0);
      engine.add(sleeve);

      var rTop = new THREE.Mesh(ringGeo, mGreenGlow);
      rTop.rotation.x = Math.PI / 2;
      rTop.position.set(x, 2.15, 0);
      engine.add(rTop);

      var rBot = new THREE.Mesh(ringGeo, mGreenGlow);
      rBot.rotation.x = Math.PI / 2;
      rBot.position.set(x, 0.70, 0);
      engine.add(rBot);

      // pistón
      var pg = new THREE.Group();
      var crown = new THREE.Mesh(crownGeo, mAlu);
      crown.castShadow = true;
      pg.add(crown);
      var r1 = new THREE.Mesh(pRingGeo, mDark); r1.position.y = 0.09; pg.add(r1);
      var r2 = new THREE.Mesh(pRingGeo, mDark); r2.position.y = 0.01; pg.add(r2);
      var skirt = new THREE.Mesh(skirtGeo, mAluDark); skirt.position.y = -0.24; pg.add(skirt);
      var wpin = new THREE.Mesh(pinGeo, mDark); wpin.position.y = -0.20; pg.add(wpin);
      pg.position.x = x;
      engine.add(pg);
      pistons.push(pg);

      // biela
      var rg2 = new THREE.Group();
      var rodBody = new THREE.Mesh(rodBodyGeo, mAlu);
      rodBody.castShadow = true;
      rg2.add(rodBody);
      var big = new THREE.Mesh(rodBigGeo, mAluDark); big.position.y = -ROD_L / 2; rg2.add(big);
      var sm  = new THREE.Mesh(rodSmGeo, mAluDark);  sm.position.y  =  ROD_L / 2; rg2.add(sm);
      rg2.position.x = x;
      engine.add(rg2);
      rods.push(rg2);
    }

    /* ---------- cigüeñal ---------- */
    var crank = new THREE.Group();
    crank.position.y = CRANK_Y;
    engine.add(crank);

    var journal = new THREE.Mesh(axleGeo(0.135, 4.1, 24), mAluDark);
    journal.castShadow = true;
    crank.add(journal);

    var webGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.11, 30);
    webGeo.rotateZ(Math.PI / 2);
    var pinBigGeo = axleGeo(0.12, 0.44, 18);

    for (var k = 0; k < 4; k++) {
      var sub = new THREE.Group();
      sub.rotation.x = PHASE[k];
      crank.add(sub);

      var pinM = new THREE.Mesh(pinBigGeo, mAlu);
      pinM.position.set(XS[k], THROW, 0);
      pinM.castShadow = true;
      sub.add(pinM);

      for (var s = -1; s <= 1; s += 2) {
        var web = new THREE.Mesh(webGeo, mGraphite);
        web.position.set(XS[k] + s * 0.29, THROW * 0.42, 0);
        web.castShadow = true;
        sub.add(web);

        var cw = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.13, 26).rotateZ(Math.PI / 2), mDark);
        cw.position.set(XS[k] + s * 0.29, -THROW * 0.62, 0);
        sub.add(cw);
      }
    }

    // polea delantera y volante motor
    var pulley = new THREE.Group();
    pulley.position.set(-2.12, 0, 0);
    crank.add(pulley);
    var pulleyBody = new THREE.Mesh(axleGeo(0.50, 0.14, 36), mGraphite);
    pulleyBody.castShadow = true;
    pulley.add(pulleyBody);
    for (var gv = -1; gv <= 1; gv++) {
      var groove = new THREE.Mesh(axleGeo(0.46, 0.03, 30), mDark);
      groove.position.x = gv * 0.05;
      pulley.add(groove);
    }
    var hub = new THREE.Mesh(axleGeo(0.17, 0.2, 20), mGreenGlow);
    pulley.add(hub);

    var flywheel = new THREE.Mesh(axleGeo(0.66, 0.12, 44), mGraphite);
    flywheel.position.set(2.12, 0, 0);
    flywheel.castShadow = true;
    crank.add(flywheel);
    var ringGear = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.05, 10, 46).rotateY(Math.PI / 2), mGreen);
    ringGear.position.set(2.12, 0, 0);
    crank.add(ringGear);

    /* ---------- emblema: engranaje + rayo detrás ---------- */
    // el emblema no gira con el motor: se mantiene de frente, como en el logo
    var back = new THREE.Group();
    scene.add(back);

    var emblem = new THREE.Group();
    emblem.position.set(0, 0.95, -4.2);
    back.add(emblem);

    var gear = new THREE.Mesh(gearGeo(3.30, 3.02, 18, 2.72, 0.17), mGreenDeep);
    emblem.add(gear);

    var innerRing = new THREE.Mesh(new THREE.TorusGeometry(2.70, 0.05, 12, 90), mAluDark);
    innerRing.position.z = 0.02;
    emblem.add(innerRing);

    var bolt3d = new THREE.Mesh(boltGeo(0.55, 0.1), mRed);
    bolt3d.position.set(0, 1.85, 0.28);
    emblem.add(bolt3d);

    /* ---------- suelo, sombra y halo ---------- */
    var shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(7, 64),
      new THREE.ShadowMaterial({ opacity: 0.42 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.95;
    shadowPlane.receiveShadow = true;
    root.add(shadowPlane);

    var glowTex = glowTexture();
    var glow = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 64),
      new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0.55
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -1.93;
    root.add(glow);

    /* ---------- luces ---------- */
    var key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(4.5, 7.5, 5.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 24;
    key.shadow.camera.left = -7;
    key.shadow.camera.right = 7;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -7;
    key.shadow.bias = -0.0007;
    key.shadow.radius = 3;
    scene.add(key);

    var rimGreen = new THREE.PointLight(0x2fae66, 22, 18, 2);
    rimGreen.position.set(-4.8, 2.4, -3.4);
    scene.add(rimGreen);

    var rimCold = new THREE.PointLight(0xbfe2ff, 16, 16, 2);
    rimCold.position.set(5.2, 1.0, -2.6);
    scene.add(rimCold);

    var fill = new THREE.PointLight(0xffffff, 5, 12, 2);
    fill.position.set(0.5, -1.6, 4.6);
    scene.add(fill);

    scene.add(new THREE.AmbientLight(0x16211d, 0.35));

    /* ---------- encuadre responsive ---------- */
    function layout() {
      var w = host.clientWidth || 1;
      var h = host.clientHeight || 1;
      var wide = w / h > 1.15 && w > 900;

      camera.aspect = w / h;
      camera.fov = 32;
      camera.position.z = wide ? 16.5 : 13.5;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0.85, 0);

      // en pantallas anchas el motor se desplaza a la derecha para dejar
      // respirar al titular; en vertical se centra
      root.position.x = wide ? 3.7 : 0;
      root.scale.setScalar(wide ? 1 : 0.94);
      back.position.x = root.position.x;
      back.scale.copy(root.scale);

      renderer.setSize(w, h, false);
    }
    layout();

    /* ---------- animación ---------- */
    var clock = new THREE.Clock();
    var theta = reduce ? 0.9 : 0;      // ángulo del cigüeñal
    var spin  = reduce ? -0.55 : -0.35; // giro del conjunto
    var life  = 0;
    var running = true;
    var rafId = null;

    function mechanics() {
      crank.rotation.x = theta;
      for (var i = 0; i < 4; i++) {
        var b = theta + PHASE[i];
        var cy = CRANK_Y + THROW * Math.cos(b);
        var cz = THROW * Math.sin(b);
        var sinb = THROW * Math.sin(b);
        var py = CRANK_Y + THROW * Math.cos(b) + Math.sqrt(Math.max(0.0001, ROD_L * ROD_L - sinb * sinb));

        pistons[i].position.y = py;

        var dy = py - cy;
        var dz = -cz;
        rods[i].position.y = (py + cy) / 2;
        rods[i].position.z = cz / 2;
        rods[i].rotation.x = Math.atan2(dz, dy);
      }
    }

    function frame() {
      rafId = global.requestAnimationFrame(frame);
      if (!running) return;

      var dt = Math.min(clock.getDelta(), 0.05);
      life += dt;

      if (!reduce) {
        theta += dt * 2.1;
        spin  += dt * 0.17;
        root.rotation.y = spin;
        root.rotation.x = -0.05 + Math.sin(life * 0.45) * 0.028;
        root.position.y = Math.sin(life * 0.62) * 0.07;
        emblem.rotation.z = -life * 0.09;
        back.position.y = Math.sin(life * 0.62 + 1.1) * 0.05;
        bolt3d.material.emissiveIntensity = 0.75 + Math.sin(life * 2.4) * 0.35;
        mGreenGlow.emissiveIntensity = 1.2 + Math.sin(life * 1.7) * 0.25;
      } else {
        root.rotation.y = spin;
        root.rotation.x = -0.05;
      }

      mechanics();
      renderer.render(scene, camera);
    }

    mechanics();
    renderer.render(scene, camera);
    if (!reduce) frame(); else rafId = null;

    /* ---------- ciclo de vida ---------- */
    var ro = null;
    if (global.ResizeObserver) {
      ro = new ResizeObserver(function () { layout(); if (reduce) renderer.render(scene, camera); });
      ro.observe(host);
    } else {
      global.addEventListener('resize', layout);
    }

    if (global.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
        if (running) clock.getDelta();
      }, { threshold: 0.01 }).observe(host);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else { running = true; clock.getDelta(); }
    });

    return {
      dispose: function () {
        if (rafId) global.cancelAnimationFrame(rafId);
        if (ro) ro.disconnect();
        renderer.dispose();
      }
    };
  }

  /* =========================================================
     Engranajes de la sección «Profesionales»
     Dos ruedas dentadas engranadas de verdad (misma paso de
     diente, velocidades en razón inversa al nº de dientes):
     la verde es la mecánica; la cromada, con anillo de luz y
     el rayo del logotipo, la electrónica.
     ========================================================= */
  function initGears(canvas) {
    if (!THREE || !canvas) return null;

    var W = canvas.clientWidth || 1;
    var H = canvas.clientHeight || 1;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { return null; }

    var reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.86;

    var scene = new THREE.Scene();
    // cámara algo más alejada: deja margen para que ningún diente toque el borde
    var camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 50);
    camera.position.set(0, 0, 9.6);
    camera.lookAt(0, 0, 0);

    var pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    var envSrc = studioEnvTexture();
    scene.environment = pmrem.fromEquirectangular(envSrc).texture;
    envSrc.dispose();
    pmrem.dispose();

    var mGreen  = new THREE.MeshStandardMaterial({ color: 0x0a7a39, metalness: 0.6, roughness: 0.34, emissive: 0x04301a, emissiveIntensity: 0.22, envMapIntensity: 0.45 });
    var mChrome = new THREE.MeshStandardMaterial({ color: 0xaeb7bb, metalness: 1.0, roughness: 0.24, envMapIntensity: 0.8 });
    var mSteel  = new THREE.MeshStandardMaterial({ color: 0x7c878b, metalness: 1.0, roughness: 0.32 });
    var mDark   = new THREE.MeshStandardMaterial({ color: 0x131a17, metalness: 0.86, roughness: 0.44 });
    var mLed    = new THREE.MeshStandardMaterial({ color: 0x4db87c, metalness: 0.2, roughness: 0.3, emissive: 0x4db87c, emissiveIntensity: 1.1 });
    var mRed    = new THREE.MeshStandardMaterial({ color: 0xd8392d, metalness: 0.4, roughness: 0.3, emissive: 0xd8392d, emissiveIntensity: 0.8 });

    function zCyl(r, d, seg) { return new THREE.CylinderGeometry(r, r, d, seg || 36).rotateX(Math.PI / 2); }

    // geometría de engrane
    var NA = 16, NB = 10, TOOTH = 0.17;
    var RPA = 1.35;
    var RPB = RPA * NB / NA;               // mismo paso circular
    var STEP_A = Math.PI * 2 / NA;
    var STEP_B = Math.PI * 2 / NB;
    var PHI = 0.6;                         // ángulo de la línea entre centros
    var DIST = RPA + RPB;

    // en la forma de gearGeo el diente está centrado en 0.4·paso y el hueco en 0.9·paso
    var BASE_A = PHI - 0.4 * STEP_A;
    var BASE_B = PHI + Math.PI - 0.9 * STEP_B;

    // el conjunto se desplaza para que su caja envolvente quede centrada en el encuadre
    var group = new THREE.Group();
    group.position.set(0.12, 0.12, 0);
    scene.add(group);

    // rueda A — mecánica
    var A = new THREE.Group();
    A.position.set(-0.78, -0.42, 0);
    group.add(A);

    var gearA = new THREE.Mesh(
      gearGeo(RPA + TOOTH / 2, RPA - TOOTH / 2, NA, 0.24, 0.34, { count: 6, radius: 0.2, dist: 0.8 }),
      mGreen
    );
    A.add(gearA);
    var rimA = new THREE.Mesh(new THREE.TorusGeometry(RPA - 0.27, 0.03, 10, 90), mChrome);
    rimA.position.z = 0.19;
    A.add(rimA);
    A.add(new THREE.Mesh(zCyl(0.42, 0.44, 40), mDark));
    var axleA = new THREE.Mesh(zCyl(0.19, 0.58, 28), mChrome);
    A.add(axleA);
    var ledA = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.022, 8, 56), mLed);
    ledA.position.z = 0.225;
    A.add(ledA);

    // rueda B — electrónica
    var B = new THREE.Group();
    B.position.set(A.position.x + DIST * Math.cos(PHI), A.position.y + DIST * Math.sin(PHI), 0);
    group.add(B);

    var gearB = new THREE.Mesh(
      gearGeo(RPB + TOOTH / 2, RPB - TOOTH / 2, NB, 0.2, 0.3, { count: 5, radius: 0.1, dist: 0.5 }),
      mChrome
    );
    B.add(gearB);
    var ledB = new THREE.Mesh(new THREE.TorusGeometry(RPB - 0.17, 0.02, 8, 70), mLed);
    ledB.position.z = 0.17;
    B.add(ledB);
    B.add(new THREE.Mesh(zCyl(0.3, 0.42, 32), mDark));
    B.add(new THREE.Mesh(zCyl(0.12, 0.5, 20), mSteel));
    var bolt = new THREE.Mesh(boltGeo(0.2, 0.06), mRed);
    bolt.position.z = 0.27;
    B.add(bolt);

    // luces
    // luz rasante lateral: dibuja cantos y dientes sin «quemar» las caras planas
    var key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(6, 3.5, 1.2);
    scene.add(key);
    var top = new THREE.DirectionalLight(0xeaf6ef, 0.45);
    top.position.set(-2, 6, 2);
    scene.add(top);
    var rim = new THREE.PointLight(0x2fae66, 18, 14, 2);
    rim.position.set(-3.2, 2.2, -1.8);
    scene.add(rim);
    var cold = new THREE.PointLight(0xcfe6ff, 5, 14, 2);
    cold.position.set(3.4, -2.2, 2.4);
    scene.add(cold);
    scene.add(new THREE.AmbientLight(0x1a2420, 0.35));

    var clock = new THREE.Clock();
    var t = 0;
    var running = true;
    var OMEGA = 0.32;

    function pose() {
      gearA.rotation.z = BASE_A + OMEGA * t;
      gearB.rotation.z = BASE_B - OMEGA * (NA / NB) * t;
      group.rotation.y = 0.32 + Math.sin(t * 0.3) * 0.14;
      group.rotation.x = -0.3 + Math.sin(t * 0.23) * 0.06;
      mLed.emissiveIntensity = 1.0 + Math.sin(t * 1.6) * 0.25;
      bolt.material.emissiveIntensity = 0.7 + Math.sin(t * 2.4) * 0.3;
    }

    function frame() {
      global.requestAnimationFrame(frame);
      if (!running) return;
      t += Math.min(clock.getDelta(), 0.05);
      pose();
      renderer.render(scene, camera);
    }

    function resize() {
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (reduce) renderer.render(scene, camera);
    }

    pose();
    renderer.render(scene, camera);
    if (!reduce) frame();

    if (global.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    else global.addEventListener('resize', resize);

    var inView = true;
    if (global.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        running = inView && !document.hidden;
        if (running) clock.getDelta();
      }, { threshold: 0.01 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () {
      running = inView && !document.hidden;
      if (running) clock.getDelta();
    });

    return { dispose: function () { renderer.dispose(); } };
  }

  global.NAOS3D = { init: init, initGears: initGears };

})(window);
