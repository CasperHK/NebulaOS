import { createSignal, onCleanup, onMount } from "solid-js";
import Windows from "../components/Windows";

type ModelViewerProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

export default function Model3DViewer(props: ModelViewerProps) {
	const [statusText, setStatusText] = createSignal("Ready");
	const [modelLabel, setModelLabel] = createSignal("Default Demo Mesh");
	const [autoRotate, setAutoRotate] = createSignal(true);
	const [bgColor, setBgColor] = createSignal("#0a1324");

	let viewportRef: HTMLDivElement | undefined;
	let openFileRef: HTMLInputElement | undefined;

	let disposeViewer: (() => void) | null = null;
	let loadModelFromFile: ((file: File) => void) | null = null;
	let resetDemoModel: (() => void) | null = null;
	let updateRendererColor: ((hex: string) => void) | null = null;

	onMount(async () => {
		if (!viewportRef) {
			return;
		}

		setStatusText("Initializing 3D engine...");

		const THREE = await import("three");
		const [{ OrbitControls }, { GLTFLoader }] = await Promise.all([
			import("three/examples/jsm/controls/OrbitControls.js"),
			import("three/examples/jsm/loaders/GLTFLoader.js"),
		]);

		const scene = new THREE.Scene();
		scene.background = new THREE.Color(bgColor());

		const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 2000);
		camera.position.set(2.5, 2, 4.5);

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		viewportRef.appendChild(renderer.domElement);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.07;
		controls.minDistance = 0.8;
		controls.maxDistance = 30;

		const hemi = new THREE.HemisphereLight(0xc7d2fe, 0x0f172a, 0.9);
		scene.add(hemi);

		const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
		keyLight.position.set(4, 7, 3);
		keyLight.castShadow = true;
		scene.add(keyLight);

		const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.6);
		fillLight.position.set(-5, 2, -4);
		scene.add(fillLight);

		const floor = new THREE.Mesh(
			new THREE.CircleGeometry(12, 64),
			new THREE.MeshStandardMaterial({ color: 0x0b1528, roughness: 0.9, metalness: 0.05 }),
		);
		floor.rotation.x = -Math.PI / 2;
		floor.position.y = -1.2;
		floor.receiveShadow = true;
		scene.add(floor);

		const modelRoot = new THREE.Group();
		scene.add(modelRoot);

		const disposeObject = (object: any) => {
			object.traverse((node: any) => {
				const mesh = node as any;
				if (!mesh.isMesh) return;

				mesh.geometry?.dispose();

				if (Array.isArray(mesh.material)) {
					mesh.material.forEach((material: any) => material.dispose());
				} else {
					mesh.material?.dispose();
				}
			});
		};

		const clearModel = () => {
			while (modelRoot.children.length > 0) {
				const child = modelRoot.children[0];
				modelRoot.remove(child);
				disposeObject(child);
			}
		};

		const fitCameraToCurrentModel = () => {
			const box = new THREE.Box3().setFromObject(modelRoot);
			if (box.isEmpty()) return;

			const size = box.getSize(new THREE.Vector3());
			const center = box.getCenter(new THREE.Vector3());
			const radius = Math.max(size.x, size.y, size.z) * 0.6;
			const cameraDistance = Math.max(radius / Math.tan((camera.fov * Math.PI) / 360), 1.8) * 1.55;

			camera.position.set(center.x + cameraDistance, center.y + cameraDistance * 0.55, center.z + cameraDistance);
			controls.target.copy(center);
			controls.update();
		};

		const createDemoModel = () => {
			clearModel();

			const body = new THREE.Mesh(
				new THREE.TorusKnotGeometry(0.85, 0.27, 220, 32),
				new THREE.MeshStandardMaterial({
					color: 0x34d399,
					metalness: 0.55,
					roughness: 0.2,
					emissive: 0x072a24,
					emissiveIntensity: 0.25,
				}),
			);
			body.castShadow = true;
			modelRoot.add(body);

			const accent = new THREE.Mesh(
				new THREE.IcosahedronGeometry(0.34, 2),
				new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.25, roughness: 0.32 }),
			);
			accent.position.set(0, -0.25, 0.8);
			accent.castShadow = true;
			modelRoot.add(accent);

			fitCameraToCurrentModel();
			setModelLabel("Default Demo Mesh");
			setStatusText("Loaded demo model");
		};

		const loader = new GLTFLoader();
		loadModelFromFile = (file: File) => {
			if (!file.name.toLowerCase().endsWith(".glb") && !file.name.toLowerCase().endsWith(".gltf")) {
				setStatusText("Unsupported format. Please use .glb or .gltf");
				return;
			}

			setStatusText("Loading model...");
			const fileUrl = URL.createObjectURL(file);

			loader.load(
				fileUrl,
				(gltf: any) => {
					clearModel();
					modelRoot.add(gltf.scene);
					modelRoot.traverse((child: any) => {
						const mesh = child as any;
						if (!mesh.isMesh) return;
						mesh.castShadow = true;
						mesh.receiveShadow = true;
					});

					fitCameraToCurrentModel();
					setModelLabel(file.name);
					setStatusText("Model loaded");
					URL.revokeObjectURL(fileUrl);
				},
				undefined,
				() => {
					setStatusText("Failed to load this model file");
					URL.revokeObjectURL(fileUrl);
				},
			);
		};

		resetDemoModel = createDemoModel;
		updateRendererColor = (hex: string) => {
			scene.background = new THREE.Color(hex);
		};

		const resize = () => {
			if (!viewportRef) return;
			const width = viewportRef.clientWidth;
			const height = viewportRef.clientHeight;
			if (width <= 0 || height <= 0) return;

			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height);
		};

		const observer = new ResizeObserver(resize);
		observer.observe(viewportRef);
		resize();
		createDemoModel();

		let rafId = 0;
		const tick = () => {
			if (autoRotate()) {
				modelRoot.rotation.y += 0.004;
			}

			controls.update();
			renderer.render(scene, camera);
			rafId = window.requestAnimationFrame(tick);
		};

		tick();

		disposeViewer = () => {
			window.cancelAnimationFrame(rafId);
			observer.disconnect();
			controls.dispose();
			clearModel();
			renderer.dispose();
			renderer.domElement.remove();
		};
	});

	onCleanup(() => {
		disposeViewer?.();
		disposeViewer = null;
	});

	return (
		<Windows
			title="3D Model Viewer"
			icon="3D"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="50%"
			left="50%"
			width="min(1080px, 96vw)"
			height="min(700px, 88vh)"
			background="rgba(8,12,24,0.96)"
		>
			<div
				style={{
					display: "grid",
					"grid-template-columns": "1fr 300px",
					gap: "0.9rem",
					padding: "0.9rem",
					height: "100%",
				}}
			>
				<div
					ref={viewportRef}
					style={{
						border: "1px solid rgba(255,255,255,0.12)",
						"border-radius": "12px",
						overflow: "hidden",
						background: "#0a1324",
						position: "relative",
					}}
				>
					<div
						style={{
							position: "absolute",
							top: "0.6rem",
							left: "0.6rem",
							padding: "0.3rem 0.5rem",
							"border-radius": "999px",
							background: "rgba(2,8,20,0.65)",
							border: "1px solid rgba(255,255,255,0.15)",
							color: "#c7d7f2",
							"font-size": "0.74rem",
							"pointer-events": "none",
						}}
					>
						Drag to orbit • Scroll to zoom
					</div>
				</div>

				<aside
					style={{
						border: "1px solid rgba(255,255,255,0.12)",
						"border-radius": "12px",
						background: "rgba(255,255,255,0.03)",
						padding: "0.8rem",
						display: "flex",
						"flex-direction": "column",
						gap: "0.75rem",
						overflow: "auto",
					}}
				>
					<h3 style={{ color: "#e8eeff", "font-size": "0.96rem" }}>Model Controls</h3>

					<button
						type="button"
						onClick={() => openFileRef?.click()}
						style={{
							border: "none",
							"border-radius": "9px",
							padding: "0.52rem 0.62rem",
							cursor: "pointer",
							color: "#fff",
							background: "linear-gradient(135deg, #2563eb, #06b6d4)",
							"font-size": "0.81rem",
							"font-weight": "700",
						}}
					>
						Open GLB/GLTF File
					</button>

					<input
						ref={openFileRef}
						type="file"
						accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
						style={{ display: "none" }}
						onChange={(event) => {
							const file = event.currentTarget.files?.[0];
							if (file) {
								loadModelFromFile?.(file);
							}
							event.currentTarget.value = "";
						}}
					/>

					<button
						type="button"
						onClick={() => resetDemoModel?.()}
						style={{
							border: "1px solid rgba(255,255,255,0.2)",
							"border-radius": "9px",
							padding: "0.48rem 0.62rem",
							cursor: "pointer",
							color: "#cfe2ff",
							background: "rgba(255,255,255,0.05)",
							"font-size": "0.8rem",
						}}
					>
						Load Demo Mesh
					</button>

					<label
						style={{
							display: "flex",
							"align-items": "center",
							gap: "0.5rem",
							color: "#cfd9ee",
							"font-size": "0.82rem",
						}}
					>
						<input
							type="checkbox"
							checked={autoRotate()}
							onChange={(event) => setAutoRotate(event.currentTarget.checked)}
						/>
						Auto rotate
					</label>

					<label style={{ color: "#bcd0eb", "font-size": "0.8rem", display: "flex", "flex-direction": "column", gap: "0.3rem" }}>
						Background
						<input
							type="color"
							value={bgColor()}
							onInput={(event) => {
								const next = event.currentTarget.value;
								setBgColor(next);
								updateRendererColor?.(next);
							}}
							style={{ width: "100%", height: "36px", border: "none", background: "transparent", cursor: "pointer" }}
						/>
					</label>

					<div
						style={{
							border: "1px solid rgba(255,255,255,0.12)",
							"border-radius": "10px",
							background: "rgba(2,8,20,0.55)",
							padding: "0.6rem",
							display: "flex",
							"flex-direction": "column",
							gap: "0.3rem",
						}}
					>
						<span style={{ color: "#8ba3c7", "font-size": "0.72rem", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>
							Model
						</span>
						<strong style={{ color: "#e9f1ff", "font-size": "0.84rem", "word-break": "break-word" }}>{modelLabel()}</strong>
						<span style={{ color: "#9ec0eb", "font-size": "0.77rem" }}>{statusText()}</span>
					</div>

					<p style={{ color: "#7487a8", "font-size": "0.76rem", "line-height": "1.4" }}>
						Tip: For best results, upload .glb files with embedded textures. Some .gltf files may require external texture files.
					</p>
				</aside>
			</div>
		</Windows>
	);
}
