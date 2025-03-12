-- SQL script para configurar políticas de seguridad (RLS) para el bucket de perfiles en Supabase

-- 1. Crear el bucket 'profiles' si no existe
INSERT INTO storage.buckets (id, name, public)
SELECT 'profiles', 'profiles', false
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'profiles'
);

-- 2. Crear política para permitir a usuarios autenticados INSERTAR archivos en el bucket 'profiles'
CREATE POLICY "Usuarios pueden subir sus propios avatares" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'profiles' AND auth.uid() = owner);

-- 3. Crear política para permitir a usuarios autenticados VER sus propios archivos
-- y permitir que los avatares sean visibles públicamente
CREATE POLICY "Usuarios pueden ver sus propios archivos y avatares públicos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
    bucket_id = 'profiles' 
    AND (auth.uid() = owner OR (name LIKE 'avatars/%'))
);

-- 4. Crear política para permitir a usuarios autenticados ACTUALIZAR sus propios archivos
CREATE POLICY "Usuarios pueden actualizar sus propios archivos" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'profiles' AND auth.uid() = owner);

-- 5. Crear política para permitir a usuarios autenticados ELIMINAR sus propios archivos
CREATE POLICY "Usuarios pueden eliminar sus propios archivos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'profiles' AND auth.uid() = owner);

-- Nota: Este script debe ejecutarse en el SQL Editor de Supabase
-- 1. Ve al panel de control de Supabase: https://app.supabase.io
-- 2. Selecciona tu proyecto
-- 3. Ve a SQL Editor
-- 4. Pega este script y ejecútalo
-- 5. Verifica que las políticas se hayan creado correctamente en Storage > Policies