import { For, createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import Windows from "../components/Windows";

type VideoPlayerProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

type VideoTrack = {
	id: string;
	title: string;
	durationLabel: string;
	url: string;
	isObjectUrl?: boolean;
};

const TRACKS: VideoTrack[] = [
	{
		id: "flower",
		title: "Flower (Sample)",
		durationLabel: "00:30",
		url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
	},
	{
		id: "big-buck-bunny",
		title: "Big Buck Bunny (Trailer)",
		durationLabel: "09:56",
		url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
	},
	{
		id: "elephant-dream",
		title: "Elephant Dream",
		durationLabel: "10:53",
		url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
	},
];

const formatTime = (value: number) => {
	if (!Number.isFinite(value) || value < 0) return "00:00";
	const m = Math.floor(value / 60)
		.toString()
		.padStart(2, "0");
	const s = Math.floor(value % 60)
		.toString()
		.padStart(2, "0");
	return `${m}:${s}`;
};

export default function VideoPlayer(props: VideoPlayerProps) {
	const [playlist, setPlaylist] = createSignal<VideoTrack[]>(TRACKS);
	const [trackIndex, setTrackIndex] = createSignal(0);
	const [isPlaying, setIsPlaying] = createSignal(false);
	const [progressSec, setProgressSec] = createSignal(0);
	const [durationSec, setDurationSec] = createSignal(0);
	const [volume, setVolume] = createSignal(0.8);
	const [isMuted, setIsMuted] = createSignal(false);
	const [playbackRate, setPlaybackRate] = createSignal(1);
	const [isLooping, setIsLooping] = createSignal(false);
	const [errorText, setErrorText] = createSignal("");

	let containerRef: HTMLDivElement | undefined;
	let videoRef: HTMLVideoElement | undefined;

	const activeTrack = createMemo(() => playlist()[trackIndex()] ?? playlist()[0]);
	const progressRatio = createMemo(() => {
		const d = durationSec();
		if (!d) return 0;
		return Math.min(1, progressSec() / d);
	});

	createEffect(() => {
		const video = videoRef;
		if (!video) return;
		const track = activeTrack();
		if (!track) return;

		setErrorText("");
		video.src = track.url;
		video.load();
		setProgressSec(0);
		setDurationSec(0);

		if (isPlaying()) {
			void video.play().catch(() => setIsPlaying(false));
		}
	});

	createEffect(() => {
		const video = videoRef;
		if (!video) return;
		video.volume = isMuted() ? 0 : volume();
	});

	createEffect(() => {
		const video = videoRef;
		if (!video) return;
		video.playbackRate = playbackRate();
	});

	createEffect(() => {
		const video = videoRef;
		if (!video) return;
		video.loop = isLooping();
	});

	const togglePlayback = async () => {
		const video = videoRef;
		if (!video) return;
		if (isPlaying()) {
			video.pause();
			return;
		}
		try {
			await video.play();
		} catch {
			setIsPlaying(false);
		}
	};

	const skip = (step: number) => {
		setTrackIndex((current) => {
			const total = playlist().length;
			if (!total) return 0;
			return (current + step + total) % total;
		});
		setIsPlaying(true);
	};

	const seekTo = (ratio: number) => {
		const video = videoRef;
		if (!video) return;
		const target = Math.min(1, Math.max(0, ratio));
		const sec = target * (durationSec() || 0);
		video.currentTime = sec;
		setProgressSec(sec);
	};

	const handleFilePick = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		setPlaylist((prev) => {
			const next = [...prev];
			const oldCustom = next.find((t) => t.id === "local-video" && t.isObjectUrl);
			if (oldCustom?.url) URL.revokeObjectURL(oldCustom.url);
			const track: VideoTrack = {
				id: "local-video",
				title: file.name,
				durationLabel: "Local",
				url,
				isObjectUrl: true,
			};
			const idx = next.findIndex((t) => t.id === "local-video");
			if (idx >= 0) next[idx] = track;
			else next.unshift(track);
			return next;
		});
		setTrackIndex(0);
		setIsPlaying(true);
		input.value = "";
	};

	const toggleFullscreen = async () => {
		const host = containerRef;
		if (!host) return;
		if (document.fullscreenElement) {
			await document.exitFullscreen().catch(() => {});
			return;
		}
		await host.requestFullscreen().catch(() => {});
	};

	const togglePiP = async () => {
		const video = videoRef;
		if (!video) return;
		try {
			if (document.pictureInPictureElement) {
				await document.exitPictureInPicture();
			} else if (document.pictureInPictureEnabled) {
				await video.requestPictureInPicture();
			}
		} catch {
			setErrorText("Picture-in-picture is unavailable in this browser.");
		}
	};

	onCleanup(() => {
		const custom = playlist().find((t) => t.id === "local-video" && t.isObjectUrl);
		if (custom?.url) URL.revokeObjectURL(custom.url);
	});

	return (
		<Windows
			title="Nebula Video"
			icon="🎬"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="52%"
			left="50%"
			width="min(1080px, 97vw)"
			height="min(700px, 90vh)"
			background="rgba(9,13,25,0.97)"
		>
			<div ref={containerRef} style={{ display: "grid", "grid-template-columns": "1.5fr 1fr", height: "100%" }}>
				<div style={{ display: "flex", "flex-direction": "column", "border-right": "1px solid rgba(255,255,255,0.08)" }}>
					<div style={{ flex: "1", display: "grid", "place-items": "center", background: "#070b14" }}>
						<video
							ref={videoRef}
							controls={false}
							  playsinline
							onTimeUpdate={() => setProgressSec(videoRef?.currentTime ?? 0)}
							onLoadedMetadata={() => setDurationSec(videoRef?.duration ?? 0)}
							onDurationChange={() => setDurationSec(videoRef?.duration ?? 0)}
							onPlay={() => setIsPlaying(true)}
							onPause={() => setIsPlaying(false)}
							onEnded={() => {
								if (!isLooping()) skip(1);
							}}
							onError={() => setErrorText("Failed to load video source.")}
							style={{ width: "100%", height: "100%", "object-fit": "contain", background: "#000" }}
						/>
					</div>

					<div style={{ padding: "0.75rem", display: "grid", gap: "0.6rem", "border-top": "1px solid rgba(255,255,255,0.08)" }}>
						<div
							style={{
								height: "7px",
								background: "rgba(255,255,255,0.1)",
								"border-radius": "999px",
								cursor: "pointer",
								position: "relative",
							}}
							onClick={(e) => {
								const rect = e.currentTarget.getBoundingClientRect();
								seekTo((e.clientX - rect.left) / rect.width);
							}}
						>
							<div
								style={{
									width: `${progressRatio() * 100}%`,
									height: "100%",
									background: "linear-gradient(135deg, #22d3ee, #818cf8)",
									"border-radius": "999px",
								}}
							/>
						</div>

						<div style={{ display: "flex", "align-items": "center", gap: "0.5rem", color: "#cdd6f4", "font-size": "0.8rem" }}>
							<button type="button" onClick={() => skip(-1)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "#cdd6f4", "border-radius": "7px", padding: "0.3rem 0.5rem", cursor: "pointer" }}>⏮</button>
							<button type="button" onClick={togglePlayback} style={{ background: "linear-gradient(135deg,#22d3ee,#818cf8)", border: "none", color: "#0b1224", "border-radius": "7px", padding: "0.3rem 0.8rem", cursor: "pointer", "font-weight": "700" }}>{isPlaying() ? "Pause" : "Play"}</button>
							<button type="button" onClick={() => skip(1)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "#cdd6f4", "border-radius": "7px", padding: "0.3rem 0.5rem", cursor: "pointer" }}>⏭</button>
							<span style={{ color: "#9aa3be" }}>{formatTime(progressSec())} / {formatTime(durationSec())}</span>
							<span style={{ "margin-left": "auto", color: "#9aa3be" }}>{activeTrack()?.title}</span>
						</div>

						<div style={{ display: "flex", "align-items": "center", gap: "0.55rem", color: "#cdd6f4", "font-size": "0.78rem" }}>
							<button type="button" onClick={() => setIsMuted((m) => !m)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "#cdd6f4", "border-radius": "7px", padding: "0.28rem 0.5rem", cursor: "pointer" }}>{isMuted() ? "Unmute" : "Mute"}</button>
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={volume()}
								onInput={(e) => setVolume(parseFloat(e.currentTarget.value))}
								style={{ width: "120px" }}
							/>
							<label style={{ color: "#9aa3be" }}>Speed</label>
							<select value={playbackRate()} onChange={(e) => setPlaybackRate(parseFloat(e.currentTarget.value))} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "#cdd6f4", "border-radius": "6px", padding: "0.15rem 0.3rem" }}>
								<option value="0.5">0.5x</option>
								<option value="0.75">0.75x</option>
								<option value="1">1x</option>
								<option value="1.25">1.25x</option>
								<option value="1.5">1.5x</option>
								<option value="2">2x</option>
							</select>
							<button type="button" onClick={() => setIsLooping((v) => !v)} style={{ background: isLooping() ? "rgba(59,130,246,0.25)" : "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "#cdd6f4", "border-radius": "7px", padding: "0.28rem 0.5rem", cursor: "pointer" }}>Loop</button>
							<button type="button" onClick={togglePiP} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "#cdd6f4", "border-radius": "7px", padding: "0.28rem 0.5rem", cursor: "pointer" }}>PiP</button>
							<button type="button" onClick={toggleFullscreen} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "#cdd6f4", "border-radius": "7px", padding: "0.28rem 0.5rem", cursor: "pointer" }}>Fullscreen</button>
						</div>
					</div>
				</div>

				<div style={{ display: "flex", "flex-direction": "column", padding: "0.8rem", gap: "0.7rem", overflow: "hidden" }}>
					<div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
						<label
							style={{
								border: "1px solid rgba(255,255,255,0.14)",
								background: "rgba(255,255,255,0.07)",
								color: "#cdd6f4",
								"border-radius": "7px",
								padding: "0.35rem 0.55rem",
								cursor: "pointer",
								"font-size": "0.78rem",
							}}
						>
							Load Local Video
							<input type="file" accept="video/*" onChange={handleFilePick} style={{ display: "none" }} />
						</label>
						<span style={{ color: "#8f98b5", "font-size": "0.76rem" }}>Playlist</span>
					</div>

					{errorText() && (
						<div style={{ color: "#f38ba8", "font-size": "0.76rem", border: "1px solid rgba(243,139,168,0.35)", background: "rgba(243,139,168,0.08)", "border-radius": "8px", padding: "0.45rem 0.55rem" }}>
							{errorText()}
						</div>
					)}

					<div style={{ overflow: "auto", display: "grid", gap: "0.45rem", padding: "0.1rem" }}>
						<For each={playlist()}>
							{(track, idx) => (
								<button
									type="button"
									onClick={() => {
										setTrackIndex(idx());
										setIsPlaying(true);
									}}
									style={{
										border: activeTrack()?.id === track.id ? "1px solid rgba(129,140,248,0.55)" : "1px solid rgba(255,255,255,0.12)",
										background: activeTrack()?.id === track.id ? "rgba(129,140,248,0.16)" : "rgba(255,255,255,0.05)",
										color: "#dbe4ff",
										"border-radius": "9px",
										padding: "0.55rem 0.6rem",
										cursor: "pointer",
										display: "flex",
										"justify-content": "space-between",
										"align-items": "center",
										gap: "0.5rem",
										"font-size": "0.78rem",
									}}
								>
									<span style={{ "text-align": "left" }}>{track.title}</span>
									<span style={{ color: "#8f98b5", "font-size": "0.72rem" }}>{track.durationLabel}</span>
								</button>
							)}
						</For>
					</div>
				</div>
			</div>
		</Windows>
	);
}
