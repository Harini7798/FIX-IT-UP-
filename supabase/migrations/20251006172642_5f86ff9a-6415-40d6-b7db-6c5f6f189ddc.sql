-- Drop existing fixer update policies to recreate them with new logic
DROP POLICY IF EXISTS "Fixers can update repair status to in-progress or completed" ON repair_requests;
DROP POLICY IF EXISTS "Fixers can update their own requests" ON repair_requests;

-- Create new policy for fixers to start work (assigned -> in_progress)
CREATE POLICY "Fixers can start assigned work" ON repair_requests
  FOR UPDATE
  USING (auth.uid() = fixer_id AND status = 'assigned')
  WITH CHECK (status = 'in_progress');

-- Create new policy for fixers to submit for review (in_progress -> awaiting_confirmation)
CREATE POLICY "Fixers can submit work for review" ON repair_requests
  FOR UPDATE
  USING (auth.uid() = fixer_id AND status = 'in_progress')
  WITH CHECK (status = 'awaiting_confirmation');

-- Create new policy for owners to confirm completion (awaiting_confirmation -> completed)
CREATE POLICY "Owners can confirm completion" ON repair_requests
  FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM items WHERE id = repair_requests.item_id)
    AND status = 'awaiting_confirmation'
  )
  WITH CHECK (status = 'completed');

-- Update notification function to handle new status
CREATE OR REPLACE FUNCTION public.notify_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item_owner_id uuid;
  item_title text;
  fixer_name text;
BEGIN
  -- Only notify on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get item owner and title
    SELECT user_id, title INTO item_owner_id, item_title
    FROM items
    WHERE id = NEW.item_id;
    
    -- Get fixer name
    SELECT display_name INTO fixer_name
    FROM profiles
    WHERE user_id = NEW.fixer_id;
    
    -- Handle different status transitions
    IF NEW.status = 'awaiting_confirmation' THEN
      -- Notify owner that work is ready for review
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        item_owner_id,
        'Work Ready for Review',
        COALESCE(fixer_name, 'Fixer') || ' has completed work on your ' || item_title || '. Please review and confirm.',
        'status_update',
        '/item/' || NEW.item_id
      );
    ELSIF NEW.status = 'completed' THEN
      -- Notify fixer that owner confirmed completion
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        NEW.fixer_id,
        'Work Confirmed Complete',
        'Owner confirmed completion of ' || item_title || '. You can now receive reviews.',
        'status_update',
        '/item/' || NEW.item_id
      );
    ELSE
      -- Default notification for other status changes
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        item_owner_id,
        'Repair Status Updated',
        'Your ' || item_title || ' repair status changed to: ' || NEW.status,
        'status_update',
        '/item/' || NEW.item_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;