-- 1. Adiciona a coluna avatar_url na tabela profiles (se não existir)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Cria o bucket de armazenamento "avatars" (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Segurança (RLS) para o bucket "avatars"

-- Permite que qualquer pessoa veja os avatares (leitura pública)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permite que usuários autenticados façam upload de avatares na pasta raiz ou em suas próprias subpastas
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Permite que usuários autenticados atualizem/substituam seus próprios avatares
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Permite que usuários deletem seus próprios avatares
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);
