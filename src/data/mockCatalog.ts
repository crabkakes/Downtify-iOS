import { Track, Playlist } from '../types';

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    releaseYear: '2020',
    trackNumber: 9,
    genre: 'Synthpop',
    duration: 200,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    source: 'spotify',
    sourceUrl: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    format: 'flac',
    bitrate: 'lossless',
    fileSizeMb: 24.8,
    downloadedAt: Date.now() - 3600000 * 24 * 2,
    isrc: 'USUM71922097',
    synthConfig: {
      bpm: 171,
      rootFreq: 261.63, // C4
      chords: [
        [220, 261.63, 329.63], // F#m / A
        [196, 246.94, 293.66], // E / G
        [246.94, 293.66, 369.99], // Bm
        [220, 277.18, 329.63], // A
      ],
      melodyNotes: [440, 493.88, 554.37, 659.25, 739.99],
      genre: 'synthwave',
    },
    lyrics: [
      { time: 0, text: 'Yeah' },
      { time: 14, text: "I've been tryna call" },
      { time: 18, text: "I've been on my own for long enough" },
      { time: 23, text: 'Maybe you can show me how to love, maybe' },
      { time: 31, text: "I'm going through withdrawals" },
      { time: 36, text: "You don't even have to do too much" },
      { time: 41, text: 'You can turn me on with just a touch, baby' },
      { time: 49, text: 'I look around and Sin City’s cold and empty' },
      { time: 54, text: 'No one’s around to judge me' },
      { time: 58, text: "I can't see clearly when you're gone" },
      { time: 64, text: "I said, ooh, I'm blinded by the lights" },
      { time: 73, text: "No, I can't sleep until I feel your touch" },
      { time: 82, text: "I said, ooh, I'm drowning in the night" },
      { time: 91, text: "Oh, when I'm like this, you're the one I trust" },
      { time: 104, text: "I'm running out of time" },
      { time: 109, text: "'Cause I can see the sun light up the sky" },
      { time: 114, text: "So I hit the road in overdrive, baby, oh" },
      { time: 124, text: 'The city’s cold and empty' },
      { time: 132, text: "I said, ooh, I'm blinded by the lights" },
      { time: 141, text: "No, I can't sleep until I feel your touch" },
    ],
  },
  {
    id: 'track-2',
    title: 'Get Lucky',
    artist: 'Daft Punk ft. Pharrell Williams',
    album: 'Random Access Memories',
    releaseYear: '2013',
    trackNumber: 8,
    genre: 'Disco Funk',
    duration: 248,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    source: 'spotify',
    sourceUrl: 'https://open.spotify.com/track/2Foc5Q5nqNiosCNqttzHof',
    format: 'mp3',
    bitrate: '320k',
    fileSizeMb: 9.6,
    downloadedAt: Date.now() - 3600000 * 24 * 5,
    isrc: 'USQX91300108',
    synthConfig: {
      bpm: 116,
      rootFreq: 246.94, // B minor
      chords: [
        [246.94, 293.66, 369.99], // Bm
        [293.66, 369.99, 440], // D
        [185, 220, 277.18], // F#m
        [220, 277.18, 329.63], // E
      ],
      melodyNotes: [370, 440, 494, 554, 659],
      genre: 'electronic',
    },
    lyrics: [
      { time: 0, text: 'Like the legend of the Phoenix' },
      { time: 7, text: 'All ends with beginnings' },
      { time: 13, text: 'What keeps the planet spinning' },
      { time: 20, text: 'The force from the beginning' },
      { time: 26, text: "We've come too far to give up who we are" },
      { time: 33, text: "So let's raise the bar and our cups to the stars" },
      { time: 40, text: "She's up all night 'til the sun" },
      { time: 43, text: "I'm up all night to get some" },
      { time: 46, text: "She's up all night for good fun" },
      { time: 50, text: "I'm up all night to get lucky" },
      { time: 54, text: "We're up all night 'til the sun" },
      { time: 57, text: "We're up all night to get some" },
      { time: 61, text: "We're up all night for good fun" },
      { time: 64, text: "We're up all night to get lucky" },
      { time: 71, text: "We're up all night to get lucky" },
    ],
  },
  {
    id: 'track-3',
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We’re Dreaming',
    releaseYear: '2011',
    trackNumber: 2,
    genre: 'Synthwave',
    duration: 243,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    source: 'youtube',
    sourceUrl: 'https://music.youtube.com/watch?v=dX3k_QDnzHE',
    format: 'm4a',
    bitrate: '256k',
    fileSizeMb: 7.8,
    downloadedAt: Date.now() - 3600000 * 12,
    isrc: 'FR6V81100002',
    synthConfig: {
      bpm: 105,
      rootFreq: 174.61, // F
      chords: [
        [174.61, 220, 261.63], // F
        [196, 246.94, 293.66], // G
        [220, 261.63, 329.63], // Am
        [261.63, 329.63, 392], // C
      ],
      melodyNotes: [349.23, 392, 440, 523.25, 587.33],
      genre: 'synthwave',
    },
    lyrics: [
      { time: 0, text: 'Waiting in a car' },
      { time: 6, text: 'Waiting for a ride in the dark' },
      { time: 13, text: 'The night city grows' },
      { time: 19, text: 'Look and see her eyes, they glow' },
      { time: 26, text: 'Waiting in a car' },
      { time: 33, text: 'Waiting for a ride in the dark' },
      { time: 40, text: 'The night city grows' },
      { time: 47, text: 'Look and see her eyes, they glow' },
      { time: 54, text: 'The city is my church' },
      { time: 61, text: 'It wraps me in the blinding twilight' },
    ],
  },
  {
    id: 'track-4',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    album: 'Starboy',
    releaseYear: '2016',
    trackNumber: 1,
    genre: 'R&B / Electro',
    duration: 230,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    source: 'spotify',
    sourceUrl: 'https://open.spotify.com/track/7MXVkk9YM5IZxh0WSlVIqp',
    format: 'flac',
    bitrate: 'lossless',
    fileSizeMb: 27.2,
    downloadedAt: Date.now() - 3600000 * 2,
    isrc: 'USUM71606006',
    synthConfig: {
      bpm: 93,
      rootFreq: 220, // G / A
      chords: [
        [196, 233.08, 293.66], // Gm
        [174.61, 220, 261.63], // F
        [155.56, 196, 233.08], // Eb
        [174.61, 220, 261.63], // F
      ],
      melodyNotes: [392, 440, 466.16, 523.25, 587.33],
      genre: 'rnb',
    },
    lyrics: [
      { time: 0, text: "I'm tryna put you in the worst mood, ah" },
      { time: 5, text: 'P1 cleaner than your church shoes, ah' },
      { time: 9, text: 'Milli point two just to hurt you, ah' },
      { time: 14, text: 'All red Lamb’ just to tease you, ah' },
      { time: 19, text: 'None of these toys on lease too, ah' },
      { time: 24, text: 'Made your whole year in a week too, yah' },
      { time: 29, text: 'Main bitch out of your league too, ah' },
      { time: 33, text: 'Side bitch out of your league too, ah' },
      { time: 37, text: 'Look what you’ve done' },
      { time: 41, text: "I'm a motherfuckin' starboy" },
      { time: 46, text: 'Look what you’ve done' },
      { time: 50, text: "I'm a motherfuckin' starboy" },
    ],
  },
  {
    id: 'track-5',
    title: 'Resonance',
    artist: 'HOME',
    album: 'Odyssey',
    releaseYear: '2014',
    trackNumber: 3,
    genre: 'Chillwave',
    duration: 212,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    source: 'soundcloud',
    sourceUrl: 'https://soundcloud.com/home-2001/resonance',
    format: 'opus',
    bitrate: '192k',
    fileSizeMb: 5.1,
    downloadedAt: Date.now() - 3600000 * 8,
    synthConfig: {
      bpm: 85,
      rootFreq: 261.63,
      chords: [
        [261.63, 329.63, 392], // C
        [220, 261.63, 329.63], // Am
        [174.61, 220, 261.63], // F
        [196, 246.94, 293.66], // G
      ],
      melodyNotes: [523.25, 587.33, 659.25, 783.99],
      genre: 'lofi',
    },
    lyrics: [
      { time: 0, text: '[Instrumental Chillwave]' },
      { time: 30, text: '[Analog Synthesizer Chords]' },
      { time: 60, text: '[Warm Tape Saturation]' },
      { time: 90, text: '[Deep Bassline Groove]' },
      { time: 120, text: '[Reverb Dreamscape]' },
    ],
  },
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-1',
    name: 'Downtify Top Hits',
    description: 'Synced directly from Spotify Today’s Top Hits embed',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    trackIds: ['track-1', 'track-2', 'track-4'],
    monitored: true,
    lastSynced: '10 minutes ago',
    sourceUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
  },
  {
    id: 'pl-2',
    name: 'Retrowave & Synth Odyssey',
    description: 'High-bitrate FLAC and 320k electronic masterpieces',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    trackIds: ['track-3', 'track-5', 'track-1'],
    monitored: false,
    lastSynced: '2 days ago',
    sourceUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM',
  },
  {
    id: 'pl-3',
    name: 'Late Night Drives',
    description: 'Lossless audio for offline road trips with synced lyrics',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    trackIds: ['track-1', 'track-4'],
    monitored: true,
    lastSynced: 'Just now',
    sourceUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4t95PaoR1T0',
  },
];

export const QUICK_DEMO_LINKS = [
  {
    name: 'Blinding Lights',
    artist: 'The Weeknd',
    platform: 'Spotify Track',
    url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    type: 'track',
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&auto=format&fit=crop&q=80',
    duration: 200,
    bpm: 171,
    genre: 'Synthpop',
  },
  {
    name: 'After Hours [Full Album]',
    artist: 'The Weeknd (14 Tracks)',
    platform: 'Spotify Album',
    url: 'https://open.spotify.com/album/4yP0hdKOZPNshxUOjY0cZj',
    type: 'album',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    duration: 3360,
    bpm: 120,
    genre: 'R&B / Synthpop',
  },
  {
    name: 'Random Access Memories',
    artist: 'Daft Punk',
    platform: 'Spotify Album',
    url: 'https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa',
    type: 'album',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    duration: 4440,
    bpm: 116,
    genre: 'Electronic Disco',
  },
  {
    name: 'Bohemian Rhapsody',
    artist: 'Queen',
    platform: 'YouTube Music',
    url: 'https://music.youtube.com/watch?v=fJ9rUzIMcZQ',
    type: 'track',
    cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80',
    duration: 354,
    bpm: 72,
    genre: 'Classic Rock',
  },
  {
    name: 'Chillhop Essentials',
    artist: 'Various Artists',
    platform: 'SoundCloud',
    url: 'https://soundcloud.com/chillhopdotcom/sets/chillhop-essentials-spring',
    type: 'playlist',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
    duration: 1800,
    bpm: 84,
    genre: 'Lo-Fi Chill',
  },
];

export const SAMPLE_CSV_EXPORTIFY = `Spotify ID,Artist Name,Track Name,Album Name,Duration (ms),Release Date
0VjIjW4GlUZAMYd2vXMi3b,The Weeknd,Blinding Lights,After Hours,200040,2020-03-20
2Foc5Q5nqNiosCNqttzHof,Daft Punk,Get Lucky,Random Access Memories,248413,2013-05-17
7MXVkk9YM5IZxh0WSlVIqp,The Weeknd,Starboy,Starboy,230453,2016-11-25
5HCyWlXZPP0y6Gqq8TgA20,Billie Eilish,Birds of a Feather,HIT ME HARD AND SOFT,196306,2024-05-17
384s98m3k2,Arctic Monkeys,Do I Wanna Know?,AM,272394,2013-09-09`;
