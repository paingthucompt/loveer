-- Fix the clients SELECT RLS policy to only show user's own clients
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;

CREATE POLICY "Users can view their own clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() = user_id);