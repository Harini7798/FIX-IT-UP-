-- Allow item owners to update repair request status
CREATE POLICY "Item owners can update repair request status" 
ON public.repair_requests 
FOR UPDATE 
USING (auth.uid() = ( SELECT items.user_id FROM items WHERE items.id = repair_requests.item_id ));