-- Esquema específico para el sistema de favoritos en Gamify

-- Tabla para playlists favoritas
CREATE TABLE IF NOT EXISTS favorite_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, playlist_id)
);

-- Tabla para canciones favoritas
CREATE TABLE IF NOT EXISTS favorite_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- Políticas de seguridad RLS (Row Level Security)
-- Habilitar RLS en las tablas de favoritos
ALTER TABLE favorite_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_songs ENABLE ROW LEVEL SECURITY;

-- Crear políticas para favorite_playlists
CREATE POLICY "Usuarios pueden ver sus playlists favoritas"
ON favorite_playlists
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus playlists favoritas"
ON favorite_playlists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus playlists favoritas"
ON favorite_playlists
FOR DELETE
USING (auth.uid() = user_id);

-- Crear políticas para favorite_songs
CREATE POLICY "Usuarios pueden ver sus canciones favoritas"
ON favorite_songs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus canciones favoritas"
ON favorite_songs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus canciones favoritas"
ON favorite_songs
FOR DELETE
USING (auth.uid() = user_id);
