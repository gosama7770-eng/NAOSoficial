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

  /* =========================================================
     Taller 3D de la sección «Solicitar cita»
     Piezas reales de taller modeladas por código que flotan
     alrededor del formulario: disco de freno con pinza NAOS,
     bujía, llave combinada, tornillo, tuercas, pistón con biela
     y engranaje. Profundidad con niebla, paralaje con el scroll
     y con el ratón. Se pausa fuera de pantalla.
     ========================================================= */
  function initWorkshop(canvas, section) {
    if (!THREE || !canvas) return null;

    var host = canvas.parentElement || canvas;
    var W = host.clientWidth || 1;
    var H = host.clientHeight || 1;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { return null; }

    var reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var small = global.matchMedia('(max-width: 760px)').matches;

    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, small ? 1.6 : 1.8));
    renderer.setSize(W, H, false);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x070a09, 12, 28);   // las piezas lejanas se funden con el fondo

    var FOV = 32;
    var camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 60);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);

    var pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    var envSrc = studioEnvTexture();
    scene.environment = pmrem.fromEquirectangular(envSrc).texture;
    envSrc.dispose();
    pmrem.dispose();

    /* ---------- materiales ---------- */
    var mChrome  = new THREE.MeshStandardMaterial({ color: 0xcfd6d9, metalness: 1, roughness: 0.14 });
    var mSteel   = new THREE.MeshStandardMaterial({ color: 0x8f9a9e, metalness: 1, roughness: 0.3 });
    var mBright  = new THREE.MeshStandardMaterial({ color: 0xbcc5c8, metalness: 1, roughness: 0.12, side: THREE.DoubleSide });
    var mCast    = new THREE.MeshStandardMaterial({ color: 0x4a5256, metalness: 0.9, roughness: 0.55 });
    var mDark    = new THREE.MeshStandardMaterial({ color: 0x1a211e, metalness: 0.8, roughness: 0.45 });
    var mBlack   = new THREE.MeshStandardMaterial({ color: 0x0b0f0d, metalness: 0.6, roughness: 0.6 });
    var mAlu     = new THREE.MeshStandardMaterial({ color: 0xb4bdc0, metalness: 1, roughness: 0.26 });
    var mCeramic = new THREE.MeshStandardMaterial({ color: 0xeef1ee, metalness: 0, roughness: 0.28 });
    var mCopper  = new THREE.MeshStandardMaterial({ color: 0xc27a45, metalness: 1, roughness: 0.3 });
    var mGreen   = new THREE.MeshStandardMaterial({ color: 0x0c8a41, metalness: 0.6, roughness: 0.32, emissive: 0x03260f, emissiveIntensity: 0.25 });
    var mCaliper = new THREE.MeshPhysicalMaterial({
      color: 0x0c8a41, metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12,
      emissive: 0x03260f, emissiveIntensity: 0.2
    });

    function zCyl(r, d, seg) { return new THREE.CylinderGeometry(r, r, d, seg || 36).rotateX(Math.PI / 2); }
    var EXT = function (depth) {
      return { depth: depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 32 };
    };

    function hexShape(R) {
      var s = new THREE.Shape();
      for (var i = 0; i < 6; i++) {
        var a = Math.PI / 6 + i * Math.PI / 3;
        if (i === 0) s.moveTo(Math.cos(a) * R, Math.sin(a) * R);
        else s.lineTo(Math.cos(a) * R, Math.sin(a) * R);
      }
      s.closePath();
      return s;
    }

    // rosca simulada: núcleo + anillos ligeramente inclinados
    function threaded(radius, length, pitch, mat) {
      var g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, length, 24), mat));
      var tg = new THREE.TorusGeometry(radius * 0.94, radius * 0.13, 6, 28);
      tg.rotateX(Math.PI / 2);
      var n = Math.floor(length / pitch);
      for (var i = 0; i < n; i++) {
        var r = new THREE.Mesh(tg, mat);
        r.position.y = -length / 2 + pitch * (i + 0.5);
        r.rotation.z = 0.07;
        g.add(r);
      }
      return g;
    }

    /* ---------- piezas ---------- */
    function nut(mat) {
      var s = hexShape(0.42);
      var h = new THREE.Path(); h.absarc(0, 0, 0.21, 0, Math.PI * 2, true); s.holes.push(h);
      var g = new THREE.ExtrudeGeometry(s, EXT(0.3)); g.translate(0, 0, -0.15); g.computeVertexNormals();
      var grp = new THREE.Group();
      grp.add(new THREE.Mesh(g, mat));
      var inner = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.02, 8, 32), mSteel);
      inner.position.z = 0.19; grp.add(inner);
      return grp;
    }

    function bolt() {
      var g = new THREE.Group();
      var hg = new THREE.ExtrudeGeometry(hexShape(0.36), EXT(0.24));
      hg.translate(0, 0, -0.12); hg.rotateX(Math.PI / 2); hg.computeVertexNormals();
      var head = new THREE.Mesh(hg, mChrome); head.position.y = 0.76; g.add(head);
      var washer = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 36), mSteel); washer.position.y = 0.6; g.add(washer);
      var shank = threaded(0.17, 1.2, 0.07, mSteel); g.add(shank);
      var tip = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.11, 0.06, 24), mSteel); tip.position.y = -0.63; g.add(tip);
      return g;
    }

    function sparkPlug() {
      var inner = new THREE.Group();
      var prof = [[0, 1.2], [0.06, 1.2], [0.075, 1.16], [0.075, 1.08], [0.1, 1.05], [0.12, 1.0], [0.12, 0.96],
                  [0.1, 0.93], [0.12, 0.9], [0.12, 0.86], [0.1, 0.83], [0.12, 0.8], [0.12, 0.76], [0.1, 0.73],
                  [0.13, 0.68], [0.15, 0.58], [0.16, 0.46], [0.16, 0.4], [0, 0.4]];
      var pts = prof.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
      inner.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), mCeramic));
      var term = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16), mSteel); term.position.y = 1.26; inner.add(term);
      var collar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.08, 32), mChrome); collar.position.y = 0.43; inner.add(collar);
      var hex = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.24, 6), mChrome); hex.position.y = 0.28; inner.add(hex);
      var gasket = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 10, 32).rotateX(Math.PI / 2), mSteel); gasket.position.y = 0.13; inner.add(gasket);
      var thread = threaded(0.15, 0.46, 0.055, mSteel); thread.position.y = -0.14; inner.add(thread);
      var ce = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 10), mCopper); ce.position.y = -0.42; inner.add(ce);
      var ge1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), mSteel); ge1.position.set(0.12, -0.43, 0); inner.add(ge1);
      var ge2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.06), mSteel); ge2.position.set(0.06, -0.5, 0); inner.add(ge2);
      inner.position.y = -0.35;
      inner.scale.setScalar(1.35);
      var g = new THREE.Group(); g.add(inner);
      return g;
    }

    function brakeDisc() {
      var g = new THREE.Group();
      var s = new THREE.Shape(); s.absarc(0, 0, 1.6, 0, Math.PI * 2, false);
      var hub = new THREE.Path(); hub.absarc(0, 0, 0.72, 0, Math.PI * 2, true); s.holes.push(hub);
      for (var ring = 0; ring < 2; ring++) {
        var n = 18, r = ring ? 1.34 : 1.06;
        for (var i = 0; i < n; i++) {
          var a = ((i + ring * 0.5) / n) * Math.PI * 2;
          var hp = new THREE.Path(); hp.absarc(Math.cos(a) * r, Math.sin(a) * r, 0.06, 0, Math.PI * 2, true);
          s.holes.push(hp);
        }
      }
      var dg = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 72 });
      dg.translate(0, 0, -0.13); dg.computeVertexNormals();
      g.add(new THREE.Mesh(dg, mCast));

      // pista de frenado mecanizada (anillo brillante por ambas caras)
      var tf = new THREE.Mesh(new THREE.RingGeometry(1.44, 1.6, 120), mBright); tf.position.z = 0.152; g.add(tf);
      var tb = tf.clone(); tb.position.z = -0.152; g.add(tb);

      var hat = new THREE.Mesh(zCyl(0.74, 0.5, 56), mDark); hat.position.z = 0.3; g.add(hat);
      var cap = new THREE.Mesh(zCyl(0.6, 0.06, 56), mSteel); cap.position.z = 0.57; g.add(cap);
      var bore = new THREE.Mesh(zCyl(0.24, 0.08, 32), mBlack); bore.position.z = 0.6; g.add(bore);
      for (var l = 0; l < 5; l++) {
        var la = (l / 5) * Math.PI * 2 + 0.3;
        var lug = new THREE.Mesh(zCyl(0.075, 0.09, 18), mBlack);
        lug.position.set(Math.cos(la) * 0.42, Math.sin(la) * 0.42, 0.61);
        g.add(lug);
      }

      // pinza de freno en verde NAOS, con tapas y dos tornillos
      var cal = new THREE.Group();
      var ARC = 1.15;
      cal.add(new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.3, 20, 40, ARC), mCaliper));
      [0, ARC].forEach(function (a) {
        var capS = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), mCaliper);
        capS.position.set(Math.cos(a) * 1.45, Math.sin(a) * 1.45, 0);
        cal.add(capS);
      });
      [0.3, 0.85].forEach(function (a) {
        var bh = new THREE.Mesh(zCyl(0.07, 0.08, 16), mChrome);
        bh.position.set(Math.cos(a) * 1.72, Math.sin(a) * 1.72, 0.18);
        cal.add(bh);
      });
      cal.scale.z = 1.9;
      cal.rotation.z = Math.PI * 0.22;
      g.add(cal);
      return { group: g, spinPart: null };
    }

    function piston() {
      var g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.55, 48), mAlu));
      var dome = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.55, 0.06, 48), mAlu); dome.position.y = 0.3; g.add(dome);
      for (var i = 0; i < 3; i++) {
        var r = new THREE.Mesh(new THREE.CylinderGeometry(0.557, 0.557, 0.035, 48), mDark);
        r.position.y = 0.18 - i * 0.09; g.add(r);
      }
      var skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.5, 0.36, 48, 1, true), mAlu); skirt.position.y = -0.45; g.add(skirt);
      var pin = new THREE.Mesh(axleGeo(0.13, 1.02, 24), mSteel); pin.position.y = -0.38; g.add(pin);
      var rod = new THREE.Mesh(roundedBox(0.22, 1.35, 0.16, 0.08), mSteel); rod.position.y = -1.05; g.add(rod);
      var big = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.08, 12, 32), mSteel);
      big.rotation.y = Math.PI / 2; big.position.y = -1.74; g.add(big);
      g.position.y = 0.55;
      var outer = new THREE.Group(); outer.add(g);
      return outer;
    }

    function wrench() {
      var g = new THREE.Group();
      var depth = 0.12;
      var hs = new THREE.Shape();
      hs.moveTo(-1.1, -0.13); hs.lineTo(1.1, -0.17);
      hs.quadraticCurveTo(1.18, 0, 1.1, 0.17);
      hs.lineTo(-1.1, 0.13);
      hs.quadraticCurveTo(-1.18, 0, -1.1, -0.13);
      var hg = new THREE.ExtrudeGeometry(hs, EXT(depth)); hg.translate(0, 0, -depth / 2); hg.computeVertexNormals();
      g.add(new THREE.Mesh(hg, mChrome));

      // boca de estrella (12 puntas)
      var rs = new THREE.Shape(); rs.absarc(0, 0, 0.44, 0, Math.PI * 2, false);
      var star = new THREE.Path();
      for (var i = 0; i <= 24; i++) {
        var a = (i / 24) * Math.PI * 2, rr = (i % 2) ? 0.25 : 0.29;
        if (i === 0) star.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else star.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      rs.holes.push(star);
      var rg = new THREE.ExtrudeGeometry(rs, EXT(depth)); rg.translate(0, 0, -depth / 2); rg.computeVertexNormals();
      var rm = new THREE.Mesh(rg, mChrome); rm.position.x = 1.42; g.add(rm);

      // boca fija
      var R = 0.5, a0 = Math.PI * 0.22;
      var os = new THREE.Shape();
      os.moveTo(Math.cos(a0) * R, Math.sin(a0) * R);
      os.absarc(0, 0, R, a0, Math.PI * 2 - a0, false);
      os.lineTo(0.1, -0.2); os.lineTo(-0.08, -0.2); os.lineTo(-0.08, 0.2); os.lineTo(0.1, 0.2);
      os.closePath();
      var og = new THREE.ExtrudeGeometry(os, EXT(depth)); og.translate(0, 0, -depth / 2); og.computeVertexNormals();
      var om = new THREE.Mesh(og, mChrome); om.position.x = -1.48; om.rotation.z = Math.PI; g.add(om);
      return g;
    }

    function gear() {
      var g = new THREE.Group();
      g.add(new THREE.Mesh(gearGeo(0.95, 0.8, 14, 0.26, 0.28, { count: 5, radius: 0.13, dist: 0.54 }), mGreen));
      g.add(new THREE.Mesh(zCyl(0.3, 0.38, 32), mDark));
      g.add(new THREE.Mesh(zCyl(0.12, 0.5, 20), mChrome));
      return g;
    }

    /* ---------- composición ---------- */
    // [x, y] normalizados respecto al encuadre (-1..1) a la profundidad z, y escala
    var LAYOUT = {
      wide: {
        disc:   [0.74, 0.5, -1, 0.95],
        plug:   [0.93, -0.12, 0.6, 0.95],
        bolt:   [-0.9, 0.48, -0.6, 0.9],
        nutA:   [-0.72, 0.86, -2.6, 0.85],
        nutB:   [0.5, -0.9, 1, 0.7],
        nutC:   [-0.94, -0.16, 1.2, 0.62],
        piston: [-0.84, -0.72, -1, 0.85],
        wrench: [0.84, -0.66, -0.4, 0.8],
        gear:   [0.28, 0.93, -3.2, 0.9]
      },
      compact: {
        disc:   [0.34, 0.04, 0, 1.05],
        plug:   [-0.42, 0.02, 0.8, 1.05],
        bolt:   [0.9, 0.5, -1.2, 0.8],
        nutA:   [-0.08, 0.72, -2, 0.7],
        nutB:   [0.78, -0.62, 1, 0.65],
        nutC:   [-0.9, -0.56, 0.8, 0.6],
        gear:   [-0.8, 0.58, -2.2, 0.75],
        wrench: [0.0, -0.72, 1.2, 0.62],
        piston: null
      }
    };

    var items = [];
    function add(key, obj, base, spin) {
      var holder = new THREE.Group();
      var body = new THREE.Group();
      body.add(obj);
      body.rotation.set(base[0], base[1], base[2]);
      holder.add(body);
      scene.add(holder);
      items.push({
        key: key, holder: holder, body: body, base: base, spin: spin,
        phase: items.length * 1.7, bob: 0.4 + (items.length % 3) * 0.12
      });
    }

    add('disc',   brakeDisc().group, [-0.35, -0.55, 0],  [0, 0, 0.22]);
    add('plug',   sparkPlug(),       [0.25, 0, -0.55],   [0, 0.35, 0]);
    add('bolt',   bolt(),            [0.45, 0, 0.7],     [0, 0.3, 0]);
    add('nutA',   nut(mChrome),      [0.6, 0.4, 0],      [0.18, 0.25, 0]);
    add('nutB',   nut(mSteel),       [-0.5, 0.3, 0.4],   [0.22, -0.2, 0]);
    add('nutC',   nut(mChrome),      [0.9, -0.3, 0],     [-0.2, 0.15, 0]);
    add('piston', piston(),          [0.2, 0.4, 0.38],   [0, 0.3, 0]);
    add('wrench', wrench(),          [-0.35, 0.25, 0.62],[0.05, 0.12, 0]);
    add('gear',   gear(),            [-0.45, 0.3, 0],    [0, 0, -0.3]);

    /* ---------- luces ---------- */
    var key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(5, 6, 8);
    scene.add(key);
    var rimG = new THREE.PointLight(0x2fae66, 18, 30, 2); rimG.position.set(-8, 3, -2); scene.add(rimG);
    var rimC = new THREE.PointLight(0xcfe6ff, 10, 30, 2); rimC.position.set(8, -4, 2); scene.add(rimC);
    scene.add(new THREE.AmbientLight(0x1a2420, 0.35));

    /* ---------- encuadre ---------- */
    var mode = 'wide';
    function layout() {
      var w = host.clientWidth || 1, h = host.clientHeight || 1;
      mode = w < 760 ? 'compact' : 'wide';
      camera.position.z = mode === 'compact' ? 11 : 14;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    layout();

    var tanHalf = Math.tan((FOV * Math.PI) / 360);
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var t = 0;

    function progress() {
      if (!section) return 0.5;
      var r = section.getBoundingClientRect();
      var vh = global.innerHeight || 1;
      return Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
    }

    function pose() {
      var p = mode === 'wide' ? progress() : 0.5;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var L = LAYOUT[mode][it.key];
        if (!L) { it.holder.visible = false; continue; }
        it.holder.visible = true;

        var z = L[2];
        var hh = (camera.position.z - z) * tanHalf;
        var hw = hh * camera.aspect;
        var depthK = 1 + (z + 3) * 0.3;                         // las piezas cercanas se mueven más
        var drift = (p - 0.5) * 2.2 * depthK;                    // paralaje con el scroll
        var bob = Math.sin(t * it.bob + it.phase) * 0.14;        // flotación

        it.holder.position.set(
          L[0] * hw + mouse.x * 0.22 * depthK,
          L[1] * hh + bob + drift - mouse.y * 0.16 * depthK,
          z
        );
        it.holder.scale.setScalar(L[3]);
        it.body.rotation.set(
          it.base[0] + t * it.spin[0],
          it.base[1] + t * it.spin[1],
          it.base[2] + t * it.spin[2]
        );
      }
    }

    var clock = new THREE.Clock();
    var running = true, inView = false;

    function frame() {
      global.requestAnimationFrame(frame);
      if (!running) return;
      t += Math.min(clock.getDelta(), 0.05);
      pose();
      renderer.render(scene, camera);
    }

    pose();
    renderer.render(scene, camera);
    if (!reduce) frame();

    if (!reduce) {
      global.addEventListener('pointermove', function (e) {
        if (!inView) return;
        mouse.tx = (e.clientX / (global.innerWidth || 1) - 0.5) * 2;
        mouse.ty = (e.clientY / (global.innerHeight || 1) - 0.5) * 2;
      }, { passive: true });
    }

    if (global.ResizeObserver) {
      new ResizeObserver(function () { layout(); pose(); renderer.render(scene, camera); }).observe(host);
    } else {
      global.addEventListener('resize', layout);
    }

    if (global.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        running = inView && !document.hidden;
        if (running) clock.getDelta();
      }, { threshold: 0 }).observe(section || host);
    } else { inView = true; }

    document.addEventListener('visibilitychange', function () {
      running = inView && !document.hidden;
      if (running) clock.getDelta();
    });

    return { dispose: function () { renderer.dispose(); } };
  }

  global.NAOS3D = { init: init, initGears: initGears, initWorkshop: initWorkshop };

})(window);
