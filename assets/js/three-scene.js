/* =========================================================================
   BAGGYFOREVER — three-scene.js
   Exposes window.init3D() so app.js can call it safely.
   ========================================================================= */
(function(){
  let threeInit = false;

  window.init3D = function init3D(){
    const host = document.getElementById('hero3d');
    if(!host || !window.THREE || threeInit) return;
    threeInit = true;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf4f1ec, 8, 18);

    const camera = new THREE.PerspectiveCamera(42, host.clientWidth/host.clientHeight, 0.1, 100);
    camera.position.set(0, 0.4, 7);

    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 6, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff8a5c, 1.1);
    rim.position.set(-5, 2, -4);
    scene.add(rim);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30,30), new THREE.ShadowMaterial({opacity:0.12}));
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -2.4;
    ground.receiveShadow = true;
    scene.add(ground);

    const matWhite = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.35, metalness:0.05});
    const matInk   = new THREE.MeshStandardMaterial({color:0x111111, roughness:0.5, metalness:0.15});
    const matAcc   = new THREE.MeshStandardMaterial({color:0xff4d2e, roughness:0.35, metalness:0.1});
    const matSoft  = new THREE.MeshStandardMaterial({color:0xece7df, roughness:0.7, metalness:0});

    const group = new THREE.Group();
    scene.add(group);

    function add(mesh, x, y, z){
      mesh.position.set(x,y,z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    }

    const torus = add(new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.38, 24, 64), matAcc), 0, 0.2, 0);
    torus.rotation.set(Math.PI/3, 0.4, 0);
    const box = add(new THREE.Mesh(new THREE.BoxGeometry(1.2,1.6,1.2,4,4,4), matInk), -1.7, -0.3, -0.4);
    box.rotation.y = 0.6;
    add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), matWhite), 1.7, 0.5, -0.2);
    const cap = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.1, 8, 16), matSoft), 0.4, -1.2, 0.8);
    cap.rotation.z = 0.4;
    const knot = add(new THREE.Mesh(new THREE.TorusKnotGeometry(0.55, 0.18, 100, 16), matWhite), -0.9, 1.3, 0.6);
    knot.rotation.set(0.4, 0.8, 0);

    let mx=0,my=0,tx=0,ty=0;
    host.addEventListener('pointermove', e=>{
      const r = host.getBoundingClientRect();
      mx = ((e.clientX-r.left)/r.width - 0.5) * 2;
      my = ((e.clientY-r.top)/r.height - 0.5) * 2;
    });
    host.addEventListener('pointerleave', ()=>{ mx=0; my=0; });

    function resize(){
      const w = host.clientWidth, h = host.clientHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
    }
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    function tick(){
      const t = clock.getElapsedTime();
      tx += (mx-tx)*0.05; ty += (my-ty)*0.05;
      group.rotation.y = t*0.25 + tx*0.6;
      group.rotation.x = Math.sin(t*0.4)*0.08 + ty*0.35;
      group.children.forEach((m,i)=>{ m.position.y += Math.sin(t*1.2 + i*1.7)*0.0025; });
      camera.position.x = tx*0.9;
      camera.position.y = 0.4 - ty*0.6;
      camera.lookAt(0,0,0);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();
  };
})();
