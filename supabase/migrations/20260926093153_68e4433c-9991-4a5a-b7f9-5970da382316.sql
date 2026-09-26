DROP POLICY IF EXISTS "Public can download app files" ON storage.objects;

CREATE POLICY "Public can download app files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'app-downloads'
  AND (
    name = 'cashflow-buddy.apk'
    OR owner_id = (select auth.uid()::text)
  )
);