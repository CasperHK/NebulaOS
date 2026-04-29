import { For, createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import Windows from "../components/Windows";

type Track = {
	id: string;
	title: string;
	artist: string;
	genre: string;
	colorA: string;
	colorB: string;
	durationLabel: string;
	url: string;
};

const TRACKS: Track[] = [
	{
		id: "aurora-drive",
		title: "Aurora Drive",
		artist: "Nebula Waves",
		genre: "Synthwave",
		colorA: "#ff8a65",
		colorB: "#ffcd58",
		durationLabel: "04:12",
		url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
	},
	{
		id: "orbit-lounge",
		title: "Orbit Lounge",
		artist: "Dusk Protocol",
		genre: "Lo-fi",
		colorA: "#29b6f6",
		colorB: "#7e57c2",
		durationLabel: "03:48",
		url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
	},
	{
		id: "saturn-rain",
		title: "Saturn Rain",
		artist: "Luma District",
		genre: "Chill",
		colorA: "#66bb6a",
		colorB: "#26a69a",
		durationLabel: "05:01",
		url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
	},
	{
		id: "city-at-0200",
		title: "City at 02:00",
		artist: "Nightline",
		genre: "Electronica",
		colorA: "#ec407a",
		colorB: "#ab47bc",
		durationLabel: "04:34",
		url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
	},
	{
		id: "stellar-drift",
		title: "Stellar Drift",
		artist: "Afterglow Unit",
		genre: "Ambient",
		colorA: "#26c6da",
		colorB: "#42a5f5",
		durationLabel: "06:10",
		url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
	},
];

type MusicPlayerProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

const formatTime = (value: number) => {
	if (!Number.isFinite(value) || value < 0) {
		return "00:00";
	}

	const minutes = Math.floor(value / 60)
		.toString()
		.padStart(2, "0");
	const seconds = Math.floor(value % 60)
		.toString()
		.padStart(2, "0");

	return `${minutes}:${seconds}`;
};

export default function MusicPlayer(props: MusicPlayerProps) {
	const [trackIndex, setTrackIndex] = createSignal(0);
	const [isPlaying, setIsPlaying] = createSignal(false);
	const [progressSec, setProgressSec] = createSignal(0);
	const [durationSec, setDurationSec] = createSignal(0);
	const [volume, setVolume] = createSignal(0.72);
	const [isMuted, setIsMuted] = createSignal(false);

	const activeTrack = createMemo(() => TRACKS[trackIndex()]);
	const progressRatio = createMemo(() => {
		const duration = durationSec();
		if (!duration) return 0;
		return Math.min(1, progressSec() / duration);
	});

	const audio = new Audio(activeTrack().url);
	audio.preload = "metadata";
	audio.volume = volume();

	const syncDuration = () => {
		if (Number.isFinite(audio.duration) && audio.duration > 0) {
			setDurationSec(audio.duration);
		}
	};
	const handleTimeUpdate = () => setProgressSec(audio.currentTime);
	const handlePlay = () => setIsPlaying(true);
	const handlePause = () => setIsPlaying(false);
	const handleEnded = () => {
		setTrackIndex((current) => (current + 1) % TRACKS.length);
	};

	audio.addEventListener("loadedmetadata", syncDuration);
	audio.addEventListener("durationchange", syncDuration);
	audio.addEventListener("timeupdate", handleTimeUpdate);
	audio.addEventListener("play", handlePlay);
	audio.addEventListener("pause", handlePause);
	audio.addEventListener("ended", handleEnded);

	createEffect(() => {
		const track = activeTrack();
		if (audio.src !== track.url) {
			audio.src = track.url;
			audio.load();
			setProgressSec(0);
			setDurationSec(0);
			if (isPlaying()) {
				void audio.play().catch(() => setIsPlaying(false));
			}
		}
	});

	createEffect(() => {
		audio.volume = isMuted() ? 0 : volume();
	});

	const togglePlayback = async () => {
		if (isPlaying()) {
			audio.pause();
			return;
		}

		try {
			await audio.play();
		} catch {
			setIsPlaying(false);
		}
	};

	const playTrack = (index: number) => {
		setTrackIndex(index);
		setIsPlaying(true);
	};

	const skip = (step: number) => {
		setTrackIndex((current) => {
			const total = TRACKS.length;
			const next = (current + step + total) % total;
			return next;
		});
	};

	const seekToRatio = (ratio: number) => {
		const target = Math.min(1, Math.max(0, ratio));
		const nextSec = target * (durationSec() || 0);
		audio.currentTime = nextSec;
		setProgressSec(nextSec);
	};

	onCleanup(() => {
		audio.pause();
		audio.removeEventListener("loadedmetadata", syncDuration);
		audio.removeEventListener("durationchange", syncDuration);
		audio.removeEventListener("timeupdate", handleTimeUpdate);
		audio.removeEventListener("play", handlePlay);
		audio.removeEventListener("pause", handlePause);
		audio.removeEventListener("ended", handleEnded);
	});

	return (
		<Windows
			title="Nebula Music"
			icon="M"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="52%"
			left="49%"
			width="min(980px, 96vw)"
			height="min(640px, 86vh)"
			background="rgba(14,18,26,0.95)"
		>
			<style>{`
				.nebula-music-player {
					display: grid;
					grid-template-columns: 1.2fr 1fr;
					height: 100%;
					font-family: "Space Grotesk", "Segoe UI", sans-serif;
					color: #f2f6ff;
					background: radial-gradient(circle at 12% 8%, rgba(255,255,255,0.13), transparent 38%),
						linear-gradient(160deg, #121620 0%, #0e141f 55%, #0c1d29 100%);
				}

				.nebula-left {
					padding: 1rem 1rem 1.15rem;
					display: flex;
					flex-direction: column;
					gap: 0.9rem;
					border-right: 1px solid rgba(255,255,255,0.08);
				}

				.nebula-cover {
					position: relative;
					min-height: 265px;
					border-radius: 22px;
					padding: 1rem;
					overflow: hidden;
					box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.35);
				}

				.nebula-cover::before {
					content: "";
					position: absolute;
					inset: 0;
					background: linear-gradient(130deg, var(--track-a), var(--track-b));
					opacity: 0.92;
				}

				.nebula-cover::after {
					content: "";
					position: absolute;
					inset: -26%;
					background: radial-gradient(circle, rgba(255,255,255,0.34), rgba(255,255,255,0) 60%);
					animation: nebulaPulse 8s ease-in-out infinite;
				}

				.nebula-cover-inner {
					position: relative;
					z-index: 1;
					height: 100%;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
				}

				.nebula-badge {
					width: fit-content;
					padding: 0.27rem 0.58rem;
					border-radius: 999px;
					background: rgba(6, 10, 16, 0.28);
					border: 1px solid rgba(255,255,255,0.35);
					font-size: 0.74rem;
					font-weight: 700;
					letter-spacing: 0.04em;
				}

				.nebula-track-name {
					font-size: clamp(1.3rem, 2.8vw, 2rem);
					font-weight: 700;
					text-shadow: 0 6px 24px rgba(0,0,0,0.32);
				}

				.nebula-track-artist {
					font-size: 0.95rem;
					opacity: 0.94;
				}

				.nebula-stats {
					display: grid;
					grid-template-columns: repeat(3, minmax(0, 1fr));
					gap: 0.55rem;
				}

				.nebula-stat-card {
					padding: 0.65rem;
					border-radius: 12px;
					background: rgba(255,255,255,0.05);
					border: 1px solid rgba(255,255,255,0.08);
				}

				.nebula-stat-title {
					display: block;
					font-size: 0.68rem;
					text-transform: uppercase;
					letter-spacing: 0.08em;
					color: #9bb4d7;
					margin-bottom: 0.25rem;
				}

				.nebula-stat-value {
					font-size: 0.93rem;
					font-weight: 700;
				}

				.nebula-controls {
					padding: 0.85rem;
					border-radius: 16px;
					background: rgba(255,255,255,0.03);
					border: 1px solid rgba(255,255,255,0.08);
					display: flex;
					flex-direction: column;
					gap: 0.8rem;
				}

				.nebula-progress-row {
					display: flex;
					align-items: center;
					gap: 0.55rem;
					font-size: 0.76rem;
					color: #a7bad8;
				}

				.nebula-slider {
					-webkit-appearance: none;
					appearance: none;
					width: 100%;
					height: 8px;
					border-radius: 999px;
					background: linear-gradient(
						to right,
						#7cf2c5 0%,
						#7cf2c5 var(--fill),
						rgba(255,255,255,0.16) var(--fill),
						rgba(255,255,255,0.16) 100%
					);
					outline: none;
					cursor: pointer;
				}

				.nebula-slider::-webkit-slider-thumb {
					-webkit-appearance: none;
					appearance: none;
					width: 15px;
					height: 15px;
					border-radius: 50%;
					background: #f8fbff;
					box-shadow: 0 0 0 4px rgba(124,242,197,0.2);
				}

				.nebula-buttons {
					display: flex;
					justify-content: center;
					gap: 0.6rem;
				}

				.nebula-btn {
					border: 1px solid rgba(255,255,255,0.16);
					background: rgba(255,255,255,0.06);
					color: #f1f6ff;
					padding: 0.48rem 0.86rem;
					border-radius: 999px;
					font-size: 0.82rem;
					font-weight: 700;
					cursor: pointer;
					transition: transform 0.14s ease, background 0.14s ease;
				}

				.nebula-btn:hover {
					transform: translateY(-1px);
					background: rgba(255,255,255,0.14);
				}

				.nebula-btn-primary {
					background: linear-gradient(135deg, #8cffda, #39d4ff);
					color: #04231d;
					border: none;
					min-width: 114px;
				}

				.nebula-volume-row {
					display: grid;
					grid-template-columns: auto 1fr auto auto;
					gap: 0.6rem;
					align-items: center;
				}

				.nebula-right {
					display: flex;
					flex-direction: column;
					padding: 0.9rem;
					gap: 0.65rem;
					overflow: auto;
				}

				.nebula-list-title {
					font-size: 0.78rem;
					text-transform: uppercase;
					letter-spacing: 0.09em;
					color: #89a0c2;
					padding: 0.2rem 0.25rem;
				}

				.nebula-track-row {
					border: 1px solid rgba(255,255,255,0.08);
					background: rgba(255,255,255,0.03);
					border-radius: 12px;
					padding: 0.62rem 0.72rem;
					display: grid;
					grid-template-columns: auto 1fr auto;
					gap: 0.7rem;
					align-items: center;
					cursor: pointer;
					transition: border-color 0.14s ease, transform 0.14s ease, background 0.14s ease;
				}

				.nebula-track-row:hover {
					transform: translateY(-1px);
					border-color: rgba(255,255,255,0.22);
					background: rgba(255,255,255,0.07);
				}

				.nebula-track-row.active {
					background: linear-gradient(135deg, rgba(88,175,255,0.24), rgba(70,255,205,0.18));
					border-color: rgba(131,222,255,0.52);
				}

				.nebula-track-chip {
					width: 34px;
					height: 34px;
					border-radius: 9px;
					display: grid;
					place-items: center;
					font-weight: 800;
					font-size: 0.74rem;
					color: #ecf8ff;
					background: linear-gradient(130deg, var(--track-a), var(--track-b));
				}

				.nebula-track-meta {
					display: flex;
					flex-direction: column;
					gap: 0.1rem;
					min-width: 0;
				}

				.nebula-track-meta strong {
					font-size: 0.88rem;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.nebula-track-meta span {
					font-size: 0.76rem;
					color: #9ab0ce;
				}

				@keyframes nebulaPulse {
					0%, 100% { transform: translate(-8%, -6%) scale(1); }
					50% { transform: translate(10%, 8%) scale(1.15); }
				}

				@media (max-width: 900px) {
					.nebula-music-player {
						grid-template-columns: 1fr;
					}

					.nebula-left {
						border-right: none;
						border-bottom: 1px solid rgba(255,255,255,0.08);
					}
				}
			`}</style>

			<section
				class="nebula-music-player"
				style={{
					"--track-a": activeTrack().colorA,
					"--track-b": activeTrack().colorB,
				}}
			>
				<div class="nebula-left">
					<div class="nebula-cover">
						<div class="nebula-cover-inner">
							<div class="nebula-badge">Now Playing</div>
							<div>
								<div class="nebula-track-name">{activeTrack().title}</div>
								<div class="nebula-track-artist">{activeTrack().artist}</div>
							</div>
						</div>
					</div>

					<div class="nebula-stats">
						<div class="nebula-stat-card">
							<span class="nebula-stat-title">Genre</span>
							<span class="nebula-stat-value">{activeTrack().genre}</span>
						</div>
						<div class="nebula-stat-card">
							<span class="nebula-stat-title">Duration</span>
							<span class="nebula-stat-value">{durationSec() ? formatTime(durationSec()) : activeTrack().durationLabel}</span>
						</div>
						<div class="nebula-stat-card">
							<span class="nebula-stat-title">Queue</span>
							<span class="nebula-stat-value">{trackIndex() + 1}/{TRACKS.length}</span>
						</div>
					</div>

					<div class="nebula-controls">
						<div class="nebula-progress-row">
							<span>{formatTime(progressSec())}</span>
							<input
								type="range"
								min="0"
								max="1000"
								value={Math.round(progressRatio() * 1000)}
								onInput={(event) => seekToRatio(event.currentTarget.valueAsNumber / 1000)}
								class="nebula-slider"
								style={{ "--fill": `${Math.round(progressRatio() * 100)}%` }}
							/>
							<span>{durationSec() ? formatTime(durationSec()) : activeTrack().durationLabel}</span>
						</div>

						<div class="nebula-buttons">
							<button type="button" class="nebula-btn" onClick={() => skip(-1)}>Prev</button>
							<button type="button" class="nebula-btn nebula-btn-primary" onClick={togglePlayback}>
								{isPlaying() ? "Pause" : "Play"}
							</button>
							<button type="button" class="nebula-btn" onClick={() => skip(1)}>Next</button>
						</div>

						<div class="nebula-volume-row">
							<span style={{ "font-size": "0.77rem", color: "#9ab0ce" }}>Volume</span>
							<input
								type="range"
								min="0"
								max="100"
								value={Math.round(volume() * 100)}
								onInput={(event) => {
									const next = event.currentTarget.valueAsNumber / 100;
									setVolume(next);
									if (next > 0 && isMuted()) {
										setIsMuted(false);
									}
								}}
								class="nebula-slider"
								style={{ "--fill": `${Math.round((isMuted() ? 0 : volume()) * 100)}%` }}
							/>
							<button
								type="button"
								class="nebula-btn"
								onClick={() => setIsMuted((current) => !current)}
							>
								{isMuted() ? "Unmute" : "Mute"}
							</button>
							<span style={{ "font-size": "0.77rem", color: "#d7e7ff", "min-width": "3ch" }}>
								{Math.round((isMuted() ? 0 : volume()) * 100)}%
							</span>
						</div>
					</div>
				</div>

				<aside class="nebula-right">
					<div class="nebula-list-title">Up Next</div>
					<For each={TRACKS}>
						{(track, index) => (
							<button
								type="button"
								class={`nebula-track-row ${trackIndex() === index() ? "active" : ""}`}
								onClick={() => playTrack(index())}
								style={{ "--track-a": track.colorA, "--track-b": track.colorB }}
							>
								<div class="nebula-track-chip">{index() + 1}</div>
								<div class="nebula-track-meta">
									<strong>{track.title}</strong>
									<span>{track.artist} - {track.genre}</span>
								</div>
								<span style={{ color: "#a8bbd8", "font-size": "0.76rem" }}>{track.durationLabel}</span>
							</button>
						)}
					</For>
				</aside>
			</section>
		</Windows>
	);
}
