// Firebase service for handling playlists and songs
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, addDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './config';

// Collection references
const playlistsCollection = collection(db, 'playlists');
const songsCollection = collection(db, 'songs');

// Fetch all playlists for a user
export const fetchPlaylists = async (userId) => {
  try {
    const q = query(playlistsCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const playlists = {};
    querySnapshot.forEach((doc) => {
      const playlistData = doc.data();
      playlists[doc.id] = {
        id: doc.id,
        ...playlistData,
      };
    });
    
    return playlists;
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
};

// Create a new playlist
export const createPlaylist = async (userId, playlist) => {
  try {
    const newPlaylistRef = doc(playlistsCollection);
    const newPlaylist = {
      ...playlist,
      userId,
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(newPlaylistRef, newPlaylist);
    
    return {
      id: newPlaylistRef.id,
      ...newPlaylist
    };
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

// Update a playlist
export const updatePlaylist = async (playlistId, playlistData) => {
  try {
    const playlistRef = doc(playlistsCollection, playlistId);
    await updateDoc(playlistRef, {
      ...playlistData,
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
};

// Delete a playlist
export const deletePlaylist = async (playlistId) => {
  try {
    const playlistRef = doc(playlistsCollection, playlistId);
    await deleteDoc(playlistRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
};

// Add a song to a playlist
export const addSongToPlaylist = async (playlistId, song) => {
  try {
    // First, add the song to the songs collection if it doesn't exist
    const songRef = doc(songsCollection, song.id || doc(songsCollection).id);
    await setDoc(songRef, song, { merge: true });
    
    // Then add the song reference to the playlist
    const playlistRef = doc(playlistsCollection, playlistId);
    await updateDoc(playlistRef, {
      tracks: arrayUnion({
        id: songRef.id,
        title: song.title,
        game: song.game,
        composer: song.composer,
        duration: song.duration,
        audioUrl: song.audioUrl // Include the audio URL in the track data
      }),
      updatedAt: new Date()
    });
    
    return {
      id: songRef.id,
      ...song
    };
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    throw error;
  }
};

// Remove a song from a playlist
export const removeSongFromPlaylist = async (playlistId, songId) => {
  try {
    // Get the song data first to create the object for arrayRemove
    const songRef = doc(songsCollection, songId);
    const songSnap = await getDoc(songRef);
    
    if (songSnap.exists()) {
      const songData = songSnap.data();
      const playlistRef = doc(playlistsCollection, playlistId);
      
      // Remove the song from the playlist's tracks array
      await updateDoc(playlistRef, {
        tracks: arrayRemove({
          id: songId,
          title: songData.title,
          game: songData.game,
          composer: songData.composer,
          duration: songData.duration,
          audioUrl: songData.audioUrl // Include audioUrl when removing the song
        }),
        updatedAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    throw error;
  }
};

// Upload playlist image (returns URL)
export const handlePlaylistImage = async (file) => {
  if (!file) return '';
  
  try {
    // Import storage-related functions
    const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
    const { storage } = require('./config');
    
    // Create a storage reference
    const storageRef = ref(storage, `playlist-images/${Date.now()}-${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading playlist image:', error);
    throw error;
  }
};

// Initialize with default playlists if user has none
export const initializeDefaultPlaylists = async (userId) => {
  try {
    const q = query(playlistsCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    // If user has no playlists, create default ones
    if (querySnapshot.empty) {
      const defaultPlaylists = [
        {
          title: 'Persona 3 RELOAD',
          description: 'Persona 3 Reload nos pone en el papel de un estudiante que se traslada en su segundo año al instituto de Gekkoukan en la isla de Tatsumi. Pronto descubre que en este lugar sucede un fenómeno sobrenatural conocido como la Hora Oscura; una 25ª hora del día que solo unos pocos experimentan mientras el resto del mundo descansa en una especie de ataúdes.',
          image: 'https://images.genius.com/f987919fa49ef5297b311f4aa702a6b1.1000x1000x1.png',
          type: 'game',
          tracks: [
            { title: 'To Zanarkand', game: 'Final Fantasy X', composer: 'Nobuo Uematsu', duration: '3:54' },
            { title: 'Corridors of Time', game: 'Chrono Trigger', composer: 'Yasunori Mitsuda', duration: '3:12' },
            { title: 'Song of Storms', game: 'The Legend of Zelda: Ocarina of Time', composer: 'Koji Kondo', duration: '2:37' },
            { title: 'Aeriths Theme', game: 'Final Fantasy VII', composer: 'Nobuo Uematsu', duration: '4:05' },
            { title: 'Dearly Beloved', game: 'Kingdom Hearts', composer: 'Yoko Shimomura', duration: '3:28' },
            { title: 'Main Theme', game: 'Skyrim', composer: 'Jeremy Soule', duration: '4:33' },
          ]
        },
        {
          title: 'Música de Acción',
          description: 'Temas intensos para momentos de acción',
          image: 'https://placehold.co/300x300/c0392b/FFFFFF/png?text=Action',
          type: 'general',
          tracks: [
            { title: 'One-Winged Angel', game: 'Final Fantasy VII', composer: 'Nobuo Uematsu', duration: '4:36' },
            { title: 'Battle Theme', game: 'Pokemon', composer: 'Junichi Masuda', duration: '2:45' },
            { title: 'E1M1', game: 'DOOM', composer: 'Bobby Prince', duration: '1:43' },
            { title: 'Megalovania', game: 'Undertale', composer: 'Toby Fox', duration: '3:29' },
            { title: 'Rules of Nature', game: 'Metal Gear Rising', composer: 'Jamie Christopherson', duration: '3:54' },
          ]
        }
      ];
      
      for (const playlist of defaultPlaylists) {
        await createPlaylist(userId, playlist);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing default playlists:', error);
    throw error;
  }
};