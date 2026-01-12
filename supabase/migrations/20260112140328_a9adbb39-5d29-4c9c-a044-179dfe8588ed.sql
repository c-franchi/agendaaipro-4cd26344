-- Allow authenticated users to delete leads
CREATE POLICY "Authenticated users can delete leads" 
ON public.leads 
FOR DELETE 
USING (auth.uid() IS NOT NULL);